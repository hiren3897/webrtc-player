/*
 * Copyright (C) 2026 Hiren Rathod
 */

import { ISignalingAdapter } from '../types/iSignalingAdapter';

export default class WHEPAdapter implements ISignalingAdapter {
  private endpointUrl: string = '';
  private resourceUrl: string | null = null; // Stored for PATCH/DELETE requests

  initialize(url: string): void {
    // MediaMTX and most WHEP servers expect the URL to end in /whep
    // But we handle it gracefully if the user forgets.
    this.endpointUrl = url.endsWith('/whep') ? url : `${url}/whep`;
  }

  async negotiate(pc: RTCPeerConnection): Promise<void> {
    // WHEP usually requires recvonly for playback
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Optimization: We wait for 'complete' to ensure all candidates are in the SDP.
    await this.waitForIceGathering(pc);

    // POST the Offer to the WHEP endpoint
    const response = await fetch(this.endpointUrl, {
      method: 'POST',
      body: pc.localDescription?.sdp,
      headers: {
        'Content-Type': 'application/sdp',
      },
    });

    if (!response.ok) {
      throw new Error(
        `WHEP Negotiation Failed: ${response.status} ${response.statusText}`,
      );
    }

    // Save the Resource URL (needed for Layer switching or DELETE later)
    // The Location header points to the specific resource.
    const locationHeader = response.headers.get('Location');
    if (locationHeader) {
      // Handle relative or absolute URLs
      this.resourceUrl = new URL(locationHeader, this.endpointUrl).toString();
    }

    // Handle Answer
    const answerSdp = await response.text();
    if (!answerSdp) {
      throw new Error('WHEP Server returned empty SDP Answer');
    }

    await pc.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answerSdp }),
    );
  }

  destroy(): void {
    // Optional: Send a DELETE request to WHEP resource to close session cleanly
    if (this.resourceUrl) {
      fetch(this.resourceUrl, { method: 'DELETE' }).catch(() => {});
    }
    this.resourceUrl = null;
  }

  private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    return new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
      }
    });
  }
}
