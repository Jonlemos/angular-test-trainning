import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { RenegotiationsService, Renegotiation } from '../../core/api/renegotiations.service';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-renegotiations',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgClass, RouterLink],
  templateUrl: './renegotiations.component.html',
  styleUrl: './renegotiations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenegotiationsComponent {
  private renegotiationsService = inject(RenegotiationsService);

  renegotiations = toSignal(this.renegotiationsService.getAll(), { initialValue: [] as Renegotiation[] });

  statusLabel: Record<string, string> = {
    active: 'Ativa',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  };

  statusClasses: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-slate-100 text-slate-600',
  };
}
