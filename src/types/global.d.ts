// src/types/global.d.ts

interface SpeechSynthesis {
    speak(utterance: SpeechSynthesisUtterance): void;
    cancel(): void;
    pause(): void;
    resume(): void;
    pending: boolean;
    speaking: boolean;
    onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
    getVoices(): SpeechSynthesisVoice[];
  }
  
  interface SpeechSynthesisUtterance {
    text: string;
    lang: string;
    voice: SpeechSynthesisVoice | null;
    volume: number;
    rate: number;
    pitch: number;
  }
  
  interface SpeechSynthesisVoice {
    name: string;
    lang: string;
    voiceURI: string;
    localService: boolean;
    default: boolean;
  }
  
  // Declare window.speechSynthesis globally
  declare const speechSynthesis: SpeechSynthesis;
  