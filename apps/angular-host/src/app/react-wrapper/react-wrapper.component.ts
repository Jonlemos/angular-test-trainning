import { Component, OnInit, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';

@Component({
  selector: 'app-react-wrapper',
  standalone: true,
  template: `<div #reactContainer class="w-full h-screen flex items-center justify-center bg-gray-100">Carregando Login...</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReactWrapperComponent implements OnInit {
  @ViewChild('reactContainer', { static: true }) container!: ElementRef;

  async ngOnInit() {
    try {
      const m = await loadRemoteModule('reactLogin', './App').catch(() => null);
      
      if (m && m.mount) {
        m.mount(this.container.nativeElement);
      } else {
        // Fallback placeholder if remote is not running
        this.container.nativeElement.innerHTML = `
          <div class="p-8 bg-white shadow-lg rounded-xl flex flex-col items-center max-w-md w-full">
            <h2 class="text-2xl font-bold text-orange-600">Itaú PJ - Login Remoto</h2>
            <p class="mt-4 text-gray-600 text-center">O micro-frontend de login em React será renderizado aqui via Module Federation.</p>
            <button onclick="localStorage.setItem('jwt_token', 'mock-token'); localStorage.setItem('user_info', JSON.stringify({id: '1', name: 'Admin Itaú', email: 'admin@itau.com.br'})); window.location.href='/dashboard'" class="mt-6 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition">
              Simular Login Realizado
            </button>
          </div>
        `;
      }
    } catch (e) {
      console.error('Error loading react remote', e);
    }
  }
}
