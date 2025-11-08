// OneWallet Integration for OneChain

export interface OneWalletConfig {
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
}

export const oneChainConfig: OneWalletConfig = {
  chainId: 1, // OneChain mainnet
  rpcUrl: 'https://rpc.onechain.network',
  explorerUrl: 'https://explorer.onechain.network',
};

export interface OneWalletAccount {
  address: string;
  publicKey: string;
  isConnected: boolean;
}

export class OneWalletManager {
  private account: OneWalletAccount | null = null;
  private provider: any = null;

  async connect(): Promise<{ success: boolean; account?: OneWalletAccount }> {
    try {
      // @ts-ignore - OneWallet injected
      if (typeof window !== 'undefined' && window.oneWallet) {
        // @ts-ignore
        const accounts = await window.oneWallet.request({
          method: 'eth_requestAccounts',
        });

        this.account = {
          address: accounts[0],
          publicKey: accounts[0],
          isConnected: true,
        };

        // @ts-ignore
        this.provider = window.oneWallet;

        return { success: true, account: this.account };
      }

      return { success: false };
    } catch (error) {
      console.error('OneWallet connection failed:', error);
      return { success: false };
    }
  }

  async disconnect(): Promise<void> {
    this.account = null;
    this.provider = null;
  }

  getAccount(): OneWalletAccount | null {
    return this.account;
  }

  async signMessage(message: string): Promise<string | null> {
    if (!this.account || !this.provider) return null;

    try {
      // @ts-ignore
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.account.address],
      });

      return signature;
    } catch (error) {
      console.error('Signature failed:', error);
      return null;
    }
  }

  async sendTransaction(tx: {
    to: string;
    value: string;
    data?: string;
  }): Promise<string | null> {
    if (!this.account || !this.provider) return null;

    try {
      // @ts-ignore
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: this.account.address,
            to: tx.to,
            value: tx.value,
            data: tx.data || '0x',
          },
        ],
      });

      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      return null;
    }
  }

  isInstalled(): boolean {
    // @ts-ignore
    return typeof window !== 'undefined' && !!window.oneWallet;
  }
}

export const oneWalletManager = new OneWalletManager();
