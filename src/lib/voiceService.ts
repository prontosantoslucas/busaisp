// Serviço de Síntese de Voz Nativa em PT-BR para Navegação e Alertas do BusAISP

class VoiceService {
  private isMuted: boolean = false;
  private lastSpokenMessages: Map<string, number> = new Map();
  private debounceTimeMs: number = 30000; // Não repete a mesma frase antes de 30 segundos
  private ptBrVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Priorizar vozes naturais em Português do Brasil (Google, Microsoft, Apple Luciana/Felipe)
    this.ptBrVoice =
      voices.find(v => v.lang === 'pt-BR' && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Francisca'))) ||
      voices.find(v => v.lang === 'pt-BR') ||
      voices.find(v => v.lang.startsWith('pt')) ||
      null;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public speak(text: string, force: boolean = false) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    const lastSpoken = this.lastSpokenMessages.get(text);
    if (!force && lastSpoken && now - lastSpoken < this.debounceTimeMs) {
      return; // Já falado recentemente
    }

    this.lastSpokenMessages.set(text, now);

    // Cancelar fala anterior para evitar sobreposição
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05; // Levemente mais ágil para avisos de trânsito
    utterance.pitch = 1.0;

    if (this.ptBrVoice) {
      utterance.voice = this.ptBrVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  // Alertas inteligentes especializados
  public announceApproachingDestination(stopName: string) {
    this.speak(`Atenção: prepare-se para descer na próxima parada: ${stopName}.`);
  }

  public announceApproachingBus(lineDisplay: string, minutes: number) {
    if (minutes <= 1) {
      this.speak(`O ônibus da linha ${lineDisplay} está chegando no seu ponto agora.`);
    } else {
      this.speak(`O ônibus da linha ${lineDisplay} chegará em aproximadamente ${minutes} minutos.`);
    }
  }

  public announceBoarding(lineDisplay: string, destination: string, vehicleWord: string = 'ônibus') {
    this.speak(`Embarque no ${vehicleWord} linha ${lineDisplay} com destino a ${destination}.`);
  }

  public announceTransfer(instructions: string) {
    this.speak(`Desembarque e faça baldeação. ${instructions}`);
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceService = new VoiceService();
