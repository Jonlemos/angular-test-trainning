import { Component, OnDestroy, ElementRef, ChangeDetectionStrategy, inject, AfterViewInit, viewChild, signal } from '@angular/core';
import { Router } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { AuthService } from '../core/auth/auth.service';
import { TokenRefreshService } from '../core/auth/token-refresh.service';

@Component({
  selector: 'app-react-wrapper',
  standalone: true,
  templateUrl: './react-wrapper.component.html',
  styleUrl: './react-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReactWrapperComponent implements AfterViewInit, OnDestroy {
  // View Queries
  private container = viewChild.required<ElementRef>('reactContainer');
  
  // Services
  private router = inject(Router);
  private authService = inject(AuthService);
  private tokenRefreshService = inject(TokenRefreshService);
  
  // State Signals
  public isLoading = signal(true);
  public errorMessage = signal<string | null>(null);
  
  private root: any = null;

  async ngAfterViewInit() {
    await this.mountReactApp();
  }

  private async mountReactApp() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // ✅ CARREGA O REMOTE PRIMEIRO via loadRemoteModule
      const remoteModule = await loadRemoteModule({
        type: 'module',
        remoteEntry: 'http://localhost:4201/remoteEntry.js',
        exposedModule: './Login'
      });
      
      const mountFn = remoteModule.mount;
      
      if (!mountFn) {
        throw new Error('Função mount não encontrada no módulo remoto');
      }

      // 🎨 Injeta e aguarda o CSS do Remote (Evita Flash of Unstyled Content - FOUC)
      await this.injectRemoteStyles();

      // Renderiza via mount
      const containerElement = this.container().nativeElement;
      this.root = mountFn(containerElement, {
        onLoginSuccess: (token: string, user: any) => {
          this.authService.login(token, {
            id: user.id,
            name: user.name,
            email: user.email,
            document: user.cnpj || user.cpf
          });
          // 🔄 Start 5-minute refresh polling after successful login
          this.tokenRefreshService.startPolling();
          this.router.navigate(['/dashboard']);
        },
        onLoginError: (error: Error) => {
          console.error('❌ Erro no login:', error);
        }
      });

      // Só remove o loading após o CSS estar pronto e o componente montado
      this.isLoading.set(false);

    } catch (error: any) {
      console.error('❌ Erro ao montar React:', error);
      this.isLoading.set(false);
      this.errorMessage.set(error.message || 'Erro desconhecido ao carregar o sistema.');
    }
  }

  private injectRemoteStyles(): Promise<void> {
    return new Promise((resolve) => {
      const existingLink = document.getElementById('react-login-css') as HTMLLinkElement;
      
      // Se o link já existe, verifica se já carregou
      if (existingLink) {
        // Verifica se as regras de CSS já estão acessíveis (indica que carregou)
        try {
          if (existingLink.sheet && existingLink.sheet.cssRules) {
            resolve();
            return;
          }
        } catch (e) {
          // Cross-origin pode barrar cssRules, então usamos onload como fallback
        }
        
        existingLink.onload = () => resolve();
        existingLink.onerror = () => resolve();
        return;
      }

      const link = document.createElement('link');
      link.id = 'react-login-css';
      link.rel = 'stylesheet';
      link.href = 'http://localhost:4201/assets/style.css';
      
      link.onload = () => {
        console.log('🎨 CSS do Remote carregado com sucesso');
        resolve();
      };
      
      link.onerror = () => {
        console.warn('⚠️ Falha ao carregar CSS do Remote, procedendo sem estilos externos');
        resolve(); // Resolvemos de qualquer forma para não travar o app
      };

      document.head.appendChild(link);
    });
  }

  public retry() {
    this.mountReactApp();
  }

  ngOnDestroy() {
    this.tokenRefreshService.stopPolling();
    if (this.root) {
      this.root.unmount();
    }
  }
}