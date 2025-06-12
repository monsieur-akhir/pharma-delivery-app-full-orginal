
declare global {
  interface MediaStream {
    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
  }

  interface MediaStreamTrack {
    stop(): void;
    enabled: boolean;
  }

  interface Navigator {
    mediaDevices: {
      getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
    };
  }

  interface MediaStreamConstraints {
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
  }

  interface MediaTrackConstraints {
    facingMode?: string;
  }
}

export {};
