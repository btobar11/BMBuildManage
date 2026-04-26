import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export interface PaymentMetadata {
  company_id: string;
  type: 'subscription' | 'addon';
  plan?: string;
  billing_cycle?: string;
  addon_code?: string;
  quantity?: number;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('MP_ACCESS_TOKEN');
    if (!token) {
      this.logger.warn(
        'MP_ACCESS_TOKEN no configurada - MercadoPago no disponible',
      );
      return;
    }
    this.client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 5000 },
    });
  }

  /**
   * Creates a preference for a subscription payment.
   */
  async createSubscriptionPreference(
    companyId: string,
    plan: string,
    billingCycle: string,
    price: number,
  ): Promise<string> {
    const metadata: PaymentMetadata = {
      company_id: companyId,
      type: 'subscription',
      plan,
      billing_cycle: billingCycle,
    };

    return this.createPreference(
      `BMBuildManage - Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
      price,
      metadata,
    );
  }

  /**
   * Creates a preference for an addon purchase.
   */
  async createAddonPreference(
    companyId: string,
    addonCode: string,
    price: number,
    quantity: number = 1,
  ): Promise<string> {
    const metadata: PaymentMetadata = {
      company_id: companyId,
      type: 'addon',
      addon_code: addonCode,
      quantity,
    };

    return this.createPreference(
      `BMBuildManage - Addon ${addonCode}`,
      price * quantity,
      metadata,
    );
  }

  /**
   * Core method — creates a MercadoPago preference and returns the init_point URL.
   */
  private async createPreference(
    title: string,
    price: number,
    metadata: PaymentMetadata,
  ): Promise<string> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'MercadoPago no está configurado. Verifique MP_ACCESS_TOKEN.',
      );
    }
    try {
      const preference = new Preference(this.client);
      const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const response = await preference.create({
        body: {
          items: [
            {
              id: metadata.type,
              title,
              quantity: 1,
              unit_price: price,
            },
          ],
          metadata: metadata as unknown as Record<string, unknown>,
          back_urls: {
            success: `${frontUrl}/billing/success`,
            failure: `${frontUrl}/billing/failure`,
            pending: `${frontUrl}/billing/pending`,
          },
          auto_return: 'approved',
        },
      });

      return response.init_point!;
    } catch (error) {
      this.logger.error('Error creating MercadoPago preference', error);
      throw error;
    }
  }

  /**
   * Fetches a payment from MercadoPago by ID.
   */
  async getPayment(paymentId: number) {
    if (!this.client) {
      throw new InternalServerErrorException(
        'MercadoPago no está configurado. Verifique MP_ACCESS_TOKEN.',
      );
    }
    try {
      const payment = new Payment(this.client);
      return await payment.get({ id: paymentId });
    } catch (error) {
      this.logger.error(`Error fetching payment ${paymentId}`, error);
      throw error;
    }
  }
}
