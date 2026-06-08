export type ComponentKey = 'Gaji' | 'THR' | 'Bonus' | 'Insentif';
export type ComponentMode = 'avg' | 'min';

export interface IncomeComponent {
  key: ComponentKey; avg: number; min: number; mode: ComponentMode; weight: number;
}
export interface CustomerIncome {
  role: 'nasabah' | 'pasangan'; name: string; components: IncomeComponent[]; angsuran: number;
}
export interface ThpResult {
  adjusted: Record<ComponentKey, number>; grossBeforeAngsuran: number; angsuran: number; thp: number;
}
export interface JointThp { nasabah: ThpResult; pasangan?: ThpResult; total: number; }
