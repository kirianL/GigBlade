import type {
  TilopayConsultTransaction,
  TilopayCurrency,
} from "@/domain/tilopay";

export type TilopayPricing = {
  amount: number;
  currency: TilopayCurrency;
};

export type TilopaySdkSessionToken = {
  accessToken: string;
  expiresIn: string;
};

export interface TilopayGateway {
  isConfigured(): boolean;
  getPricing(): TilopayPricing;
  createSdkToken(): Promise<TilopaySdkSessionToken>;
  consultOrder(orderNumber: string): Promise<TilopayConsultTransaction[]>;
}
