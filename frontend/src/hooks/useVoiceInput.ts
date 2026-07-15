import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVoiceInputResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

function mapSpeechErrorToMessage(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return "Microphone access was denied. Check your browser's site permissions and try again.";
    case 'network':
      return "Voice recognition couldn't reach its speech service — this is usually caused by running over plain HTTP instead of HTTPS, or a network/firewall blocking the connection. Typed input still works normally.";
    case 'no-speech':
      return 'No speech was detected. Try again and speak clearly into your microphone.';
    case 'audio-capture':
      return 'No microphone was found. Check that a microphone is connected and enabled.';
    case 'aborted':
      return '';
    default:
      return `Voice recognition error (${errorCode}). Typed input still works normally.`;
  }
}

/**
 * Thin wrapper around the browser's native SpeechRecognition API. Only the
 * TEXT transcript is ever sent server-side, never audio.
 */
export function useVoiceInput(): UseVoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionCtor: (new () => SpeechRecognition) | undefined =
    typeof window !== 'undefined' ? window.SpeechRecognition ?? window.webkitSpeechRecognition : undefined;

  const isSupported = !!SpeechRecognitionCtor;

  useEffect(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      // Correct two-level access: event.results[i] is a SpeechRecognitionResult
      // (this is where .isFinal actually lives); event.results[i][0] is a
      // SpeechRecognitionAlternative (only .transcript/.confidence, NO
      // .isFinal). The original bug was annotating the alternative's type
      // as if it were the flattened shape — fixed by reading .isFinal off
      // the correct (outer) object and letting the alternative's type be
      // inferred rather than manually mis-annotated.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        if (result.isFinal) {
          finalText += alternative.transcript;
        } else {
          interimText += alternative.transcript;
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
      // start() throws if already started — safe to ignore.
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => setTranscript(''), []);

  return { isSupported, isListening, transcript, error, startListening, stopListening, resetTranscript };
}