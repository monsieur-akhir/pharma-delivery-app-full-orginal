declare module 'react-native-webrtc' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface RTCViewProps extends ViewProps {
    streamURL: string;
    objectFit?: 'contain' | 'cover';
    zOrder?: number;
  }

  export class RTCView extends Component<RTCViewProps> {}

  export interface MediaStreamTrack {
    id: string;
    kind: string;
    label: string;
    enabled: boolean;
    muted: boolean;
    readyState: 'live' | 'ended';
    remote: boolean;
    stop(): void;
  }

  export interface MediaStream {
    id: string;
    active: boolean;
    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
    addTrack(track: MediaStreamTrack): void;
    removeTrack(track: MediaStreamTrack): void;
    clone(): MediaStream;
    toURL(): string;
  }

  export interface RTCSessionDescription {
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp: string;
  }

  export interface RTCIceCandidate {
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
  }

  export const mediaDevices: {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  };
}
