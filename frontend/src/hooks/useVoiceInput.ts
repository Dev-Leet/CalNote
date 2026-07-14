import { useCallback, useEffect, useRef, useState } from 'react';

function mapSpeechErrorToMessage(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Check your browser\'s site permissions and try again.';
    case 'network':
      return 'Voice recognition couldn\'t reach its speech service — this is usually caused by running over plain HTTP instead of HTTPS, or a network/firewall blocking the connection. Typed input still works normally.';
    case 'no-speech':
      return 'No speech was detected. Try again and speak clearly into your microphone.';
    case 'audio-capture':
      return 'No microphone was found. Check that a microphone is connected and enabled.';
    case 'aborted':
      return ''; // user-initiated stop — not a real error, don't show one
    default:
      return `Voice recognition error (${errorCode}). Typed input still works normally.`;
  }
}

interface UseVoiceInputResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Thin wrapper around the browser's native SpeechRecognition API (webkit-
 * prefixed in Chrome/Edge, the two browsers this app's mockups target).
 * No external speech-to-text service or API key required — this is
 * intentionally NOT routed through Ashna or any backend; only the final
 * TEXT transcript is ever sent server-side, never audio.
 */
export function useVoiceInput(): UseVoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : undefined;

  const isSupported = !!SpeechRecognitionCtor;

  useEffect(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // matches the app's IST/en-IN locale convention

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0];
        if (event.results[i].isFinal) {
          finalText += result.transcript;
        } else {
          interimText += result.transcript;
        }
      }
      setTranscript((prev) => (finalText ? prev + finalText : prev) + (interimText ? ` ${interimText}`.trimStart() : ''));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(mapSpeechErrorToMessage(event.error));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // The Web Speech API's recognition backend runs over the network (it is
    // NOT fully on-device, despite living in the browser) and requires a
    // secure context. Over plain http://localhost, some Chrome/Edge
    // versions silently fail to establish that connection and report the
    // generic 'network' error rather than a secure-context-specific one —
    // checking this upfront turns an opaque failure into an actionable message.
    if (!window.isSecureContext) {
      setError('Voice input requires a secure connection (HTTPS). It will not work over plain http://localhost in some browsers — try https://localhost or a deployed HTTPS URL.');
      return;
    }

    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // start() throws if already started — safe to ignore, onend/onerror
      // will correct isListening state if something is genuinely wrong.
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => setTranscript(''), []);

  return { isSupported, isListening, transcript, error, startListening, stopListening, resetTranscript };
}