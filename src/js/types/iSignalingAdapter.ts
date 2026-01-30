/*
 * Copyright (C) 2026 Hiren Rathod
 */

export interface ISignalingAdapter {
  /**
   * Called when the Receiver initializes.
   * @param url The base URL for the stream.
   */
  initialize(url: string): void;

  /**
   * Exchanges SDP with the server to establish a connection.
   * @param pc The RTCPeerConnection instance created by the Receiver.
   * @returns A Promise that resolves when negotiation is complete.
   */
  negotiate(pc: RTCPeerConnection): Promise<void>;

  /**
   * Optional: Called if the connection needs to switch layers (Simulcast)
   * WHEP uses PATCH for this, others might use WebSocket messages.
   */
  setLayer?(layer: 'high' | 'medium' | 'low'): Promise<void>;

  /**
   * Clean up any internal state (timers, tokens).
   */
  destroy(): void;
}
