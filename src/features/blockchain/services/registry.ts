import {
  ChainMessage,
  ChainOperation,
  ChainQuery,
  OperationType,
} from '../types/chain';
import type { ChatCompletionTool } from 'openai/resources/index';
import {
  defaultCautionText,
  defaultIntroText,
  defaultSystemPrompt,
} from '../config';
/**
 * Central registry for all chain operations (messages and queries).
 * Manages the registration and retrieval of operations, and generates
 * OpenAI tool definitions based on registered operations.
 */
export class OperationRegistry<T> {
  /** Map of operation type to operation implementation */
  private operations: Map<string, ChainOperation<T>> = new Map();

  /**
   * Registers a new operation in the registry.
   * @param operation - Operation to register
   */
  register(operation: ChainOperation<T>) {
    this.operations.set(operation.name, operation);
  }

  /**
   * Retrieves an operation by its type.
   * @param type - Operation type identifier
   * @returns The operation implementation or undefined if not found
   */
  get(type: string): ChainOperation<T> | undefined {
    return this.operations.get(type);
  }

  /**
   * Gets all registered operations.
   * @returns Array of all registered operations
   */
  getAllOperations(): ChainOperation<T>[] {
    return Array.from(this.operations.values());
  }

  /**
   * @returns String value for the system prompt
   */
  getSystemPrompt() {
    return defaultSystemPrompt;
  }

  /**
   * @returns String value for the intro text a user sees before interacting with the chat
   */
  getIntroText() {
    return defaultIntroText;
  }

  /**
   * @returns String value for the caution text a user sees below the chat input
   */
  getCautionText() {
    return defaultCautionText;
  }

  /**
   * Gets all registered transaction message operations.
   * @returns Array of transaction operations
   */
  getMessages(): ChainMessage<T>[] {
    return this.getAllOperations().filter(
      (op): op is ChainMessage<T> =>
        'operationType' in op && op.operationType === OperationType.TRANSACTION,
    );
  }

  /**
   * Gets all registered query operations.
   * @returns Array of query operations
   */
  getQueries(): ChainQuery<T>[] {
    return this.getAllOperations().filter(
      (op): op is ChainQuery<T> =>
        'operationType' in op && op.operationType === OperationType.QUERY,
    );
  }

  /**
   * Generates OpenAI tool definitions for all registered operations.
   * These definitions are used to create function-calling tools in the AI model.
   * @returns Array of tool definitions in OpenAI format
   */
  getToolDefinitions(): ChatCompletionTool[] {
    return this.getAllOperations().map((operation) => ({
      type: 'function',
      function: {
        name: operation.name,
        description: operation.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            operation.parameters.map((param) => {
              const p = [
                param.name,
                {
                  type: param.type,
                  description: param.description,
                },
              ];

              if (param.enum) {
                // @ts-expect-error better types needed
                p[1].enum = param.enum;
              }

              return p;
            }),
          ),
          required: operation.parameters
            .filter((param) => param.required)
            .map((param) => param.name),
          strict: true,
          additionalProperties: false,
        },
      },
    }));
  }
}
