/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common";

export interface AgentOwnerRegistryInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "addAddressToWhitelist"
      | "addAddressesToWhitelist"
      | "allowAll"
      | "cancelGovernanceCall"
      | "executeGovernanceCall"
      | "getAgentDescription"
      | "getAgentIconUrl"
      | "getAgentName"
      | "getManagementAddress"
      | "getWorkAddress"
      | "governance"
      | "governanceSettings"
      | "initialise"
      | "isExecutor"
      | "isWhitelisted"
      | "productionMode"
      | "revokeAddress"
      | "setAllowAll"
      | "setWorkAddress"
      | "supportsInterface"
      | "supportsRevoke"
      | "switchToProductionMode"
      | "whitelistAndDescribeAgent"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "AgentDataChanged"
      | "GovernanceCallTimelocked"
      | "GovernanceInitialised"
      | "GovernedProductionModeEntered"
      | "TimelockedGovernanceCallCanceled"
      | "TimelockedGovernanceCallExecuted"
      | "Whitelisted"
      | "WhitelistingRevoked"
      | "WorkAddressChanged"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "addAddressToWhitelist",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "addAddressesToWhitelist",
    values: [AddressLike[]]
  ): string;
  encodeFunctionData(functionFragment: "allowAll", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "cancelGovernanceCall",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "executeGovernanceCall",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getAgentDescription",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getAgentIconUrl",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getAgentName",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getManagementAddress",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getWorkAddress",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "governance",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "governanceSettings",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initialise",
    values: [AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "isExecutor",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "isWhitelisted",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "productionMode",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "revokeAddress",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "setAllowAll",
    values: [boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "setWorkAddress",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsRevoke",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "switchToProductionMode",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "whitelistAndDescribeAgent",
    values: [AddressLike, string, string, string]
  ): string;

  decodeFunctionResult(
    functionFragment: "addAddressToWhitelist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "addAddressesToWhitelist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "allowAll", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "cancelGovernanceCall",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "executeGovernanceCall",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAgentDescription",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAgentIconUrl",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAgentName",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getManagementAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getWorkAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "governance", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "governanceSettings",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialise", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isExecutor", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isWhitelisted",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "productionMode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "revokeAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAllowAll",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setWorkAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsRevoke",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "switchToProductionMode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "whitelistAndDescribeAgent",
    data: BytesLike
  ): Result;
}

export namespace AgentDataChangedEvent {
  export type InputTuple = [
    managementAddress: AddressLike,
    name: string,
    description: string,
    iconUrl: string
  ];
  export type OutputTuple = [
    managementAddress: string,
    name: string,
    description: string,
    iconUrl: string
  ];
  export interface OutputObject {
    managementAddress: string;
    name: string;
    description: string;
    iconUrl: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace GovernanceCallTimelockedEvent {
  export type InputTuple = [
    encodedCall: BytesLike,
    encodedCallHash: BytesLike,
    allowedAfterTimestamp: BigNumberish
  ];
  export type OutputTuple = [
    encodedCall: string,
    encodedCallHash: string,
    allowedAfterTimestamp: bigint
  ];
  export interface OutputObject {
    encodedCall: string;
    encodedCallHash: string;
    allowedAfterTimestamp: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace GovernanceInitialisedEvent {
  export type InputTuple = [initialGovernance: AddressLike];
  export type OutputTuple = [initialGovernance: string];
  export interface OutputObject {
    initialGovernance: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace GovernedProductionModeEnteredEvent {
  export type InputTuple = [governanceSettings: AddressLike];
  export type OutputTuple = [governanceSettings: string];
  export interface OutputObject {
    governanceSettings: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace TimelockedGovernanceCallCanceledEvent {
  export type InputTuple = [encodedCallHash: BytesLike];
  export type OutputTuple = [encodedCallHash: string];
  export interface OutputObject {
    encodedCallHash: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace TimelockedGovernanceCallExecutedEvent {
  export type InputTuple = [encodedCallHash: BytesLike];
  export type OutputTuple = [encodedCallHash: string];
  export interface OutputObject {
    encodedCallHash: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace WhitelistedEvent {
  export type InputTuple = [value: AddressLike];
  export type OutputTuple = [value: string];
  export interface OutputObject {
    value: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace WhitelistingRevokedEvent {
  export type InputTuple = [value: AddressLike];
  export type OutputTuple = [value: string];
  export interface OutputObject {
    value: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace WorkAddressChangedEvent {
  export type InputTuple = [
    managementAddress: AddressLike,
    prevWorkAddress: AddressLike,
    workAddress: AddressLike
  ];
  export type OutputTuple = [
    managementAddress: string,
    prevWorkAddress: string,
    workAddress: string
  ];
  export interface OutputObject {
    managementAddress: string;
    prevWorkAddress: string;
    workAddress: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface AgentOwnerRegistry extends BaseContract {
  connect(runner?: ContractRunner | null): AgentOwnerRegistry;
  waitForDeployment(): Promise<this>;

  interface: AgentOwnerRegistryInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  addAddressToWhitelist: TypedContractMethod<
    [_address: AddressLike],
    [void],
    "nonpayable"
  >;

  addAddressesToWhitelist: TypedContractMethod<
    [_addresses: AddressLike[]],
    [void],
    "nonpayable"
  >;

  allowAll: TypedContractMethod<[], [boolean], "view">;

  cancelGovernanceCall: TypedContractMethod<
    [_encodedCall: BytesLike],
    [void],
    "nonpayable"
  >;

  executeGovernanceCall: TypedContractMethod<
    [_encodedCall: BytesLike],
    [void],
    "nonpayable"
  >;

  getAgentDescription: TypedContractMethod<
    [_managementAddress: AddressLike],
    [string],
    "view"
  >;

  getAgentIconUrl: TypedContractMethod<
    [_managementAddress: AddressLike],
    [string],
    "view"
  >;

  getAgentName: TypedContractMethod<
    [_managementAddress: AddressLike],
    [string],
    "view"
  >;

  getManagementAddress: TypedContractMethod<
    [_workAddress: AddressLike],
    [string],
    "view"
  >;

  getWorkAddress: TypedContractMethod<
    [_managementAddress: AddressLike],
    [string],
    "view"
  >;

  governance: TypedContractMethod<[], [string], "view">;

  governanceSettings: TypedContractMethod<[], [string], "view">;

  initialise: TypedContractMethod<
    [_governanceSettings: AddressLike, _initialGovernance: AddressLike],
    [void],
    "nonpayable"
  >;

  isExecutor: TypedContractMethod<[_address: AddressLike], [boolean], "view">;

  isWhitelisted: TypedContractMethod<
    [_address: AddressLike],
    [boolean],
    "view"
  >;

  productionMode: TypedContractMethod<[], [boolean], "view">;

  revokeAddress: TypedContractMethod<
    [_address: AddressLike],
    [void],
    "nonpayable"
  >;

  setAllowAll: TypedContractMethod<[_allowAll: boolean], [void], "nonpayable">;

  setWorkAddress: TypedContractMethod<
    [_ownerWorkAddress: AddressLike],
    [void],
    "nonpayable"
  >;

  supportsInterface: TypedContractMethod<
    [_interfaceId: BytesLike],
    [boolean],
    "view"
  >;

  supportsRevoke: TypedContractMethod<[], [boolean], "view">;

  switchToProductionMode: TypedContractMethod<[], [void], "nonpayable">;

  whitelistAndDescribeAgent: TypedContractMethod<
    [
      _managementAddress: AddressLike,
      _name: string,
      _description: string,
      _iconUrl: string
    ],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "addAddressToWhitelist"
  ): TypedContractMethod<[_address: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "addAddressesToWhitelist"
  ): TypedContractMethod<[_addresses: AddressLike[]], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "allowAll"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "cancelGovernanceCall"
  ): TypedContractMethod<[_encodedCall: BytesLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "executeGovernanceCall"
  ): TypedContractMethod<[_encodedCall: BytesLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "getAgentDescription"
  ): TypedContractMethod<[_managementAddress: AddressLike], [string], "view">;
  getFunction(
    nameOrSignature: "getAgentIconUrl"
  ): TypedContractMethod<[_managementAddress: AddressLike], [string], "view">;
  getFunction(
    nameOrSignature: "getAgentName"
  ): TypedContractMethod<[_managementAddress: AddressLike], [string], "view">;
  getFunction(
    nameOrSignature: "getManagementAddress"
  ): TypedContractMethod<[_workAddress: AddressLike], [string], "view">;
  getFunction(
    nameOrSignature: "getWorkAddress"
  ): TypedContractMethod<[_managementAddress: AddressLike], [string], "view">;
  getFunction(
    nameOrSignature: "governance"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "governanceSettings"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "initialise"
  ): TypedContractMethod<
    [_governanceSettings: AddressLike, _initialGovernance: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "isExecutor"
  ): TypedContractMethod<[_address: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "isWhitelisted"
  ): TypedContractMethod<[_address: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "productionMode"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "revokeAddress"
  ): TypedContractMethod<[_address: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "setAllowAll"
  ): TypedContractMethod<[_allowAll: boolean], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "setWorkAddress"
  ): TypedContractMethod<
    [_ownerWorkAddress: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "supportsInterface"
  ): TypedContractMethod<[_interfaceId: BytesLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "supportsRevoke"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "switchToProductionMode"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "whitelistAndDescribeAgent"
  ): TypedContractMethod<
    [
      _managementAddress: AddressLike,
      _name: string,
      _description: string,
      _iconUrl: string
    ],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "AgentDataChanged"
  ): TypedContractEvent<
    AgentDataChangedEvent.InputTuple,
    AgentDataChangedEvent.OutputTuple,
    AgentDataChangedEvent.OutputObject
  >;
  getEvent(
    key: "GovernanceCallTimelocked"
  ): TypedContractEvent<
    GovernanceCallTimelockedEvent.InputTuple,
    GovernanceCallTimelockedEvent.OutputTuple,
    GovernanceCallTimelockedEvent.OutputObject
  >;
  getEvent(
    key: "GovernanceInitialised"
  ): TypedContractEvent<
    GovernanceInitialisedEvent.InputTuple,
    GovernanceInitialisedEvent.OutputTuple,
    GovernanceInitialisedEvent.OutputObject
  >;
  getEvent(
    key: "GovernedProductionModeEntered"
  ): TypedContractEvent<
    GovernedProductionModeEnteredEvent.InputTuple,
    GovernedProductionModeEnteredEvent.OutputTuple,
    GovernedProductionModeEnteredEvent.OutputObject
  >;
  getEvent(
    key: "TimelockedGovernanceCallCanceled"
  ): TypedContractEvent<
    TimelockedGovernanceCallCanceledEvent.InputTuple,
    TimelockedGovernanceCallCanceledEvent.OutputTuple,
    TimelockedGovernanceCallCanceledEvent.OutputObject
  >;
  getEvent(
    key: "TimelockedGovernanceCallExecuted"
  ): TypedContractEvent<
    TimelockedGovernanceCallExecutedEvent.InputTuple,
    TimelockedGovernanceCallExecutedEvent.OutputTuple,
    TimelockedGovernanceCallExecutedEvent.OutputObject
  >;
  getEvent(
    key: "Whitelisted"
  ): TypedContractEvent<
    WhitelistedEvent.InputTuple,
    WhitelistedEvent.OutputTuple,
    WhitelistedEvent.OutputObject
  >;
  getEvent(
    key: "WhitelistingRevoked"
  ): TypedContractEvent<
    WhitelistingRevokedEvent.InputTuple,
    WhitelistingRevokedEvent.OutputTuple,
    WhitelistingRevokedEvent.OutputObject
  >;
  getEvent(
    key: "WorkAddressChanged"
  ): TypedContractEvent<
    WorkAddressChangedEvent.InputTuple,
    WorkAddressChangedEvent.OutputTuple,
    WorkAddressChangedEvent.OutputObject
  >;

  filters: {
    "AgentDataChanged(address,string,string,string)": TypedContractEvent<
      AgentDataChangedEvent.InputTuple,
      AgentDataChangedEvent.OutputTuple,
      AgentDataChangedEvent.OutputObject
    >;
    AgentDataChanged: TypedContractEvent<
      AgentDataChangedEvent.InputTuple,
      AgentDataChangedEvent.OutputTuple,
      AgentDataChangedEvent.OutputObject
    >;

    "GovernanceCallTimelocked(bytes,bytes32,uint256)": TypedContractEvent<
      GovernanceCallTimelockedEvent.InputTuple,
      GovernanceCallTimelockedEvent.OutputTuple,
      GovernanceCallTimelockedEvent.OutputObject
    >;
    GovernanceCallTimelocked: TypedContractEvent<
      GovernanceCallTimelockedEvent.InputTuple,
      GovernanceCallTimelockedEvent.OutputTuple,
      GovernanceCallTimelockedEvent.OutputObject
    >;

    "GovernanceInitialised(address)": TypedContractEvent<
      GovernanceInitialisedEvent.InputTuple,
      GovernanceInitialisedEvent.OutputTuple,
      GovernanceInitialisedEvent.OutputObject
    >;
    GovernanceInitialised: TypedContractEvent<
      GovernanceInitialisedEvent.InputTuple,
      GovernanceInitialisedEvent.OutputTuple,
      GovernanceInitialisedEvent.OutputObject
    >;

    "GovernedProductionModeEntered(address)": TypedContractEvent<
      GovernedProductionModeEnteredEvent.InputTuple,
      GovernedProductionModeEnteredEvent.OutputTuple,
      GovernedProductionModeEnteredEvent.OutputObject
    >;
    GovernedProductionModeEntered: TypedContractEvent<
      GovernedProductionModeEnteredEvent.InputTuple,
      GovernedProductionModeEnteredEvent.OutputTuple,
      GovernedProductionModeEnteredEvent.OutputObject
    >;

    "TimelockedGovernanceCallCanceled(bytes32)": TypedContractEvent<
      TimelockedGovernanceCallCanceledEvent.InputTuple,
      TimelockedGovernanceCallCanceledEvent.OutputTuple,
      TimelockedGovernanceCallCanceledEvent.OutputObject
    >;
    TimelockedGovernanceCallCanceled: TypedContractEvent<
      TimelockedGovernanceCallCanceledEvent.InputTuple,
      TimelockedGovernanceCallCanceledEvent.OutputTuple,
      TimelockedGovernanceCallCanceledEvent.OutputObject
    >;

    "TimelockedGovernanceCallExecuted(bytes32)": TypedContractEvent<
      TimelockedGovernanceCallExecutedEvent.InputTuple,
      TimelockedGovernanceCallExecutedEvent.OutputTuple,
      TimelockedGovernanceCallExecutedEvent.OutputObject
    >;
    TimelockedGovernanceCallExecuted: TypedContractEvent<
      TimelockedGovernanceCallExecutedEvent.InputTuple,
      TimelockedGovernanceCallExecutedEvent.OutputTuple,
      TimelockedGovernanceCallExecutedEvent.OutputObject
    >;

    "Whitelisted(address)": TypedContractEvent<
      WhitelistedEvent.InputTuple,
      WhitelistedEvent.OutputTuple,
      WhitelistedEvent.OutputObject
    >;
    Whitelisted: TypedContractEvent<
      WhitelistedEvent.InputTuple,
      WhitelistedEvent.OutputTuple,
      WhitelistedEvent.OutputObject
    >;

    "WhitelistingRevoked(address)": TypedContractEvent<
      WhitelistingRevokedEvent.InputTuple,
      WhitelistingRevokedEvent.OutputTuple,
      WhitelistingRevokedEvent.OutputObject
    >;
    WhitelistingRevoked: TypedContractEvent<
      WhitelistingRevokedEvent.InputTuple,
      WhitelistingRevokedEvent.OutputTuple,
      WhitelistingRevokedEvent.OutputObject
    >;

    "WorkAddressChanged(address,address,address)": TypedContractEvent<
      WorkAddressChangedEvent.InputTuple,
      WorkAddressChangedEvent.OutputTuple,
      WorkAddressChangedEvent.OutputObject
    >;
    WorkAddressChanged: TypedContractEvent<
      WorkAddressChangedEvent.InputTuple,
      WorkAddressChangedEvent.OutputTuple,
      WorkAddressChangedEvent.OutputObject
    >;
  };
}