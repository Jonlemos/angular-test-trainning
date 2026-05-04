import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `<div class="p-4 bg-white shadow rounded-lg">
    <h2 class="text-2xl font-bold mb-4">Visão Geral</h2>
    <p class="text-gray-600">Este é o dashboard principal. Conteúdo será carregado aqui.</p>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {}
