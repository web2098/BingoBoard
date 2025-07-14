// TypeScript interfaces for all server message types

export interface BaseMessage {
  type: string;
  client_id?: string;
}

// Host outgoing messages
export interface RequestIdMessage extends BaseMessage {
  type: "request_id";
}

export interface SetupMessage extends BaseMessage {
  type: "setup";
  data: {
    game: string;
    free: boolean;
    active: number[];
    lastNumber?: number;
  };
  style: {
    selectedColor: string;
    selectedTextColor: string;
    unselectedColor: string;
    unselectedTextColor: string;
  };
  session: {
    numbers: Record<number, string>;
  };
}

export interface ActivateMessage extends BaseMessage {
  type: "activate";
  id: number;
  spots: number;
}

export interface DeactivateMessage extends BaseMessage {
  type: "deactivate";
  id: number;
  spots: number;
}

export interface UpdateFreeMessage extends BaseMessage {
  type: "update_free";
  free: boolean;
}

export interface ModalActivateMessage extends BaseMessage {
  type: "modal_activate";
  event_type: string;
  options: {
    font_size?: string;
    isGraphic?: boolean;
    [key: string]: any;
  };
}

export interface ModalDeactivateMessage extends BaseMessage {
  type: "modal_deactivate";
}

// Host incoming messages
export interface IdMessage extends BaseMessage {
  type: "id";
  client_id: string;
}

export interface UpdateRequestMessage extends BaseMessage {
  type: "update";
  client_id: string;
}

// Client outgoing messages
export interface ClientUpdateMessage extends BaseMessage {
  type: "update";
  client_id: string;
}

// Client incoming messages (same as host outgoing for most)
export type ClientSetupMessage = SetupMessage;
export type ClientActivateMessage = ActivateMessage;
export type ClientDeactivateMessage = DeactivateMessage;
export type ClientUpdateFreeMessage = UpdateFreeMessage;
export type ClientModalActivateMessage = ModalActivateMessage;
export type ClientIdMessage = IdMessage;

// Union types for message handling
export type HostOutgoingMessage =
  | RequestIdMessage
  | SetupMessage
  | ActivateMessage
  | DeactivateMessage
  | UpdateFreeMessage
  | ModalActivateMessage;

export type HostIncomingMessage =
  | IdMessage
  | UpdateRequestMessage;

export type ClientOutgoingMessage =
  | ClientUpdateMessage;

export type ClientIncomingMessage =
  | ClientIdMessage
  | ClientSetupMessage
  | ClientActivateMessage
  | ClientDeactivateMessage
  | ClientUpdateFreeMessage
  | ClientModalActivateMessage;

// Server response types
export interface HostAuthResponse {
  room_id: string;
  room_token: string;
}

// Connection configuration
export interface ServerConnectionConfig {
  serverUrl: string;
  authToken?: string;
  connectionTimeout?: number; // Timeout in milliseconds for connection attempts
  onMessage: (message: any) => void;
  onError: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface HostConnectionConfig extends ServerConnectionConfig {
  authToken: string;
}

export interface ClientConnectionConfig extends ServerConnectionConfig {
  roomId: string;
}

// Game state interfaces
export interface GameState {
  name: string;
  freeSpaceOn: boolean;
  calledNumbers: number[];
  lastNumber?: number;
}

export interface StyleConfig {
  selectedColor: string;
  selectedTextColor: string;
  unselectedColor: string;
  unselectedTextColor: string;
}

export interface SessionConfig {
  specialNumbers: Record<number, string>;
}

// Audience interaction types
export type AudienceInteractionType =
  | 'clap-message'
  | 'boo-message'
  | 'beer-message'
  | 'party-message'
  | 'skull'
  | 'order66';

export interface AudienceInteractionOptions {
  font_size?: string;
  isGraphic?: boolean;
  [key: string]: any;
}
