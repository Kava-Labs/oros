import { ethers } from 'ethers';
import { ChainMessage, ChainType, OperationType } from '../../types/chain';
import { MessageParam } from '../../types/messages';
import { OperationRegistry } from './registry';
import { TransactionDisplay } from '../../components/TransactionDisplay';
import { ToolCallStream } from '../../toolCallStreamStore';

// Can this be built instead of hard coded or imported?
interface AbiItem {
  type: string;
  name?: string;
  inputs?: AbiParameter[];
  outputs?: AbiParameter[];
  stateMutability?: string;
}

interface AbiParameter {
  name: string;
  type: string;
  components?: AbiParameter[];
}

class EvmOperationGenerator {
  private typeMapping: Record<string, string> = {
    uint256: 'string',
    address: 'string',
    bool: 'boolean',
    string: 'string',
    bytes: 'string',
  };

  generateOperations(abi: AbiItem[], contractAddress: string): ChainMessage[] {
    return abi
      .filter((item) => item.type === 'function')
      .map((item) => this.createOperation(item, contractAddress));
  }

  private createOperation(
    abiItem: AbiItem,
    contractAddress: string,
  ): ChainMessage {
    const parameters = this.createParameters(abiItem.inputs || []);

    return {
      name: abiItem.name!,
      description: `${
        abiItem.stateMutability === 'view' ? 'Query' : 'Execute'
      } the ${abiItem.name} function`,
      operationType:
        abiItem.stateMutability === 'view'
          ? OperationType.QUERY
          : OperationType.TRANSACTION,
      chainType: ChainType.EVM,
      parameters,
      validate: (params: Record<string, any>) =>
        this.validateParams(params, parameters),
      buildTransaction: async (
        params: Record<string, any>,
      ): Promise<string> => {
        const encodedData = this.encodeFunction(abiItem, params);
        // Return encoded transaction data for later use
        return JSON.stringify({
          to: contractAddress,
          data: encodedData,
          value:
            abiItem.stateMutability === 'payable' ? params.value || '0' : '0',
        });
      },
    };
  }

  private createParameters(inputs: AbiParameter[]): MessageParam[] {
    return inputs.map((input) => ({
      name: input.name,
      type: this.typeMapping[input.type] || 'string',
      description: `${input.type} parameter ${input.name}`,
      required: true,
    }));
  }

  private validateParams(
    params: Record<string, any>,
    parameters: MessageParam[],
  ): boolean {
    return parameters.every((param) => {
      const value = params[param.name];
      return value !== undefined && value !== null && value !== '';
    });
  }

  private encodeFunction(
    abiItem: AbiItem,
    params: Record<string, any>,
  ): string {
    const iface = new ethers.Interface([abiItem]);
    const values = (abiItem.inputs || []).map((input) => params[input.name]);
    return iface.encodeFunctionData(abiItem.name!, values);
  }
}

export class EvmRegistry extends OperationRegistry {
  private generator: EvmOperationGenerator;
  private allowedFunctions: Set<string>;
  private inProgressQueryComponent: React.FunctionComponent<ToolCallStream>;
  private inProgressMessageComponent: React.FunctionComponent<ToolCallStream>;

  constructor(
    allowedFunctions?: string[],
    queryComponent?: React.FunctionComponent<ToolCallStream>,
    messageComponent?: React.FunctionComponent<ToolCallStream>,
  ) {
    super();
    this.generator = new EvmOperationGenerator();
    this.allowedFunctions = new Set(allowedFunctions);
    this.inProgressQueryComponent = queryComponent || TransactionDisplay;
    this.inProgressMessageComponent = messageComponent || TransactionDisplay;
  }

  getInProgressComponent(operation: ChainMessage) {
    return () =>
      operation.operationType === OperationType.QUERY
        ? this.inProgressQueryComponent
        : this.inProgressMessageComponent;
  }

  registerContract(abi: AbiItem[], address: string) {
    const operations = this.generator
      .generateOperations(abi, address)
      .filter(
        (op) =>
          this.allowedFunctions.size === 0 ||
          this.allowedFunctions.has(op.name),
      )
      .map((op) => ({
        ...op,
        inProgressComponent: this.getInProgressComponent(op),
      }));

    operations.forEach((op) => this.register(op));
  }
}
