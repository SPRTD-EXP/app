type SizeChartRow = {
  size: string;
  length: number;
  chest?: number;
  shoulder?: number;
  sleeve?: number;
  waistline?: number;
  hip?: number;
  leg_opening?: number;
};

export type SizeChart = {
  type: 'top' | 'bottom';
  unit: 'in' | 'cm';
  rows: SizeChartRow[];
};

export type VariationOption = {
  label: string;
  size_chart?: SizeChart | null;
  size_chart_row_overrides?: SizeChartRow[];
  image_index?: number;
};

export type VariationAxis = {
  name: string;
  options: VariationOption[];
};

export type Variations = {
  axes: VariationAxis[];
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  price_cents: number;
  category: string;
  sizes: string[];
  image_urls: string[];
  stripe_product_id?: string;
  stripe_price_id?: string;
  is_preorder?: boolean;
  size_chart?: SizeChart | null;
  variations?: Variations | null;
  description?: string | null;
};

export const COLORWAYS = ['black', 'blue', 'pink', 'red'] as const;
export type Colorway = typeof COLORWAYS[number];

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
