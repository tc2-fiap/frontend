const formatters: Record<'USD' | 'BRL', Intl.NumberFormat> = {
  BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
};

export function formatPrice(value: number, currency: 'USD' | 'BRL' = 'BRL'): string {
  return formatters[currency].format(value);
}

export function brlToUsd(brlAmount: number, usdToBrlRate: number): number {
  return brlAmount / usdToBrlRate;
}
