// Gasless Transactions using OneChain Account Abstraction

export interface GaslessTransaction {
  to: string;
  value: string;
  data: string;
  nonce: number;
}

export interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  signature: string;
}

export interface PaymasterConfig {
  paymasterUrl: string;
  paymasterAddress: string;
  sponsorshipPolicy: 'full' | 'partial' | 'conditional';
}

export const oneChainPaymaster: PaymasterConfig = {
  paymasterUrl: 'https://paymaster.onechain.network',
  paymasterAddress: '0x0000000000000000000000000000000000000001', // OneChain paymaster
  sponsorshipPolicy: 'full', // Full gas sponsorship
};

export class GaslessTransactionManager {
  private paymasterConfig: PaymasterConfig;
  private bundlerUrl: string;

  constructor() {
    this.paymasterConfig = oneChainPaymaster;
    this.bundlerUrl = 'https://bundler.onechain.network';
  }

  // Create a gasless transaction
  async createGaslessTransaction(
    from: string,
    to: string,
    value: string,
    data: string
  ): Promise<{
    success: boolean;
    userOp?: UserOperation;
    message?: string;
  }> {
    try {
      // Get nonce for the account
      const nonce = await this.getNonce(from);

      // Build user operation
      const userOp: UserOperation = {
        sender: from,
        nonce: BigInt(nonce),
        initCode: '0x', // No init code for existing accounts
        callData: this.encodeCallData(to, value, data),
        callGasLimit: BigInt(100000),
        verificationGasLimit: BigInt(100000),
        preVerificationGas: BigInt(21000),
        maxFeePerGas: BigInt(0), // Gasless!
        maxPriorityFeePerGas: BigInt(0), // Gasless!
        paymasterAndData: this.paymasterConfig.paymasterAddress,
        signature: '0x', // Will be signed later
      };

      return {
        success: true,
        userOp,
      };
    } catch (error) {
      console.error('Failed to create gasless transaction:', error);
      return {
        success: false,
        message: 'Failed to create gasless transaction',
      };
    }
  }

  // Send gasless transaction
  async sendGaslessTransaction(
    userOp: UserOperation,
    signature: string
  ): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      // Add signature to user operation
      userOp.signature = signature;

      // Get paymaster signature
      const paymasterData = await this.getPaymasterData(userOp);
      if (!paymasterData.success) {
        return {
          success: false,
          message: 'Paymaster rejected transaction',
        };
      }

      userOp.paymasterAndData = paymasterData.data!;

      // Send to bundler
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendUserOperation',
          params: [this.serializeUserOp(userOp), '0x1'], // OneChain chainId
          id: 1,
        }),
      });

      const result = await response.json();

      if (result.error) {
        return {
          success: false,
          message: result.error.message,
        };
      }

      return {
        success: true,
        txHash: result.result,
      };
    } catch (error) {
      console.error('Failed to send gasless transaction:', error);
      return {
        success: false,
        message: 'Failed to send gasless transaction',
      };
    }
  }

  // Get paymaster data (sponsorship approval)
  private async getPaymasterData(
    userOp: UserOperation
  ): Promise<{
    success: boolean;
    data?: string;
  }> {
    try {
      const response = await fetch(this.paymasterConfig.paymasterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'pm_sponsorUserOperation',
          params: [this.serializeUserOp(userOp)],
          id: 1,
        }),
      });

      const result = await response.json();

      if (result.error) {
        return { success: false };
      }

      return {
        success: true,
        data: result.result.paymasterAndData,
      };
    } catch (error) {
      console.error('Paymaster request failed:', error);
      return { success: false };
    }
  }

  // Encode call data for transaction
  private encodeCallData(to: string, value: string, data: string): string {
    // Simple encoding: execute(address to, uint256 value, bytes data)
    const executeSelector = '0xb61d27f6'; // execute function selector
    
    // Pad address (20 bytes to 32 bytes)
    const paddedTo = to.slice(2).padStart(64, '0');
    
    // Pad value (convert to hex and pad to 32 bytes)
    const valueHex = BigInt(value).toString(16).padStart(64, '0');
    
    // Encode data offset (96 bytes = 3 * 32 bytes for to, value, data offset)
    const dataOffset = '0000000000000000000000000000000000000000000000000000000000000060';
    
    // Encode data length
    const dataLength = ((data.length - 2) / 2).toString(16).padStart(64, '0');
    
    // Pad data to 32-byte chunks
    const paddedData = data.slice(2).padEnd(
      Math.ceil((data.length - 2) / 64) * 64,
      '0'
    );

    return `${executeSelector}${paddedTo}${valueHex}${dataOffset}${dataLength}${paddedData}`;
  }

  // Get nonce for account
  private async getNonce(address: string): Promise<number> {
    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getUserOperationByHash',
          params: [address],
          id: 1,
        }),
      });

      const result = await response.json();
      return result.result?.nonce || 0;
    } catch (error) {
      return 0;
    }
  }

  // Serialize user operation for JSON-RPC
  private serializeUserOp(userOp: UserOperation): any {
    return {
      sender: userOp.sender,
      nonce: '0x' + userOp.nonce.toString(16),
      initCode: userOp.initCode,
      callData: userOp.callData,
      callGasLimit: '0x' + userOp.callGasLimit.toString(16),
      verificationGasLimit: '0x' + userOp.verificationGasLimit.toString(16),
      preVerificationGas: '0x' + userOp.preVerificationGas.toString(16),
      maxFeePerGas: '0x' + userOp.maxFeePerGas.toString(16),
      maxPriorityFeePerGas: '0x' + userOp.maxPriorityFeePerGas.toString(16),
      paymasterAndData: userOp.paymasterAndData,
      signature: userOp.signature,
    };
  }

  // Check if transaction is eligible for gas sponsorship
  async checkEligibility(
    from: string,
    to: string,
    value: string
  ): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    // Check sponsorship policy
    if (this.paymasterConfig.sponsorshipPolicy === 'full') {
      return { eligible: true };
    }

    // For partial or conditional, check criteria
    const valueAmount = BigInt(value);

    // Example: Only sponsor transactions under 1 ETH
    if (valueAmount > BigInt(1e18)) {
      return {
        eligible: false,
        reason: 'Transaction value too high for sponsorship',
      };
    }

    return { eligible: true };
  }

  // Estimate gas savings
  estimateGasSavings(gasPrice: bigint, gasUsed: bigint): {
    savedAmount: bigint;
    savedUSD: number;
  } {
    const savedAmount = gasPrice * gasUsed;
    // Assume 1 ETH = $2000 for estimation
    const savedUSD = Number(savedAmount) / 1e18 * 2000;

    return {
      savedAmount,
      savedUSD,
    };
  }
}

export const gaslessManager = new GaslessTransactionManager();
