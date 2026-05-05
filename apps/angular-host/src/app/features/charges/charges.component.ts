import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ChargesService, Charge } from '../../core/api/charges.service';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-charges',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgClass, RouterLink],
  templateUrl: './charges.component.html',
  styleUrl: './charges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChargesComponent {
  private chargesService = inject(ChargesService);

  charges = toSignal(this.chargesService.getAll(), { initialValue: [] as Charge[] });

  statusLabel: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Vencido',
  };

  statusClasses: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };
}
