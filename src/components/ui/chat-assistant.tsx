import { useState, useEffect, useRef } from "react";
import { X, ArrowRight, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import specialistAvatar from "@/assets/specialist-avatar.webp";

interface Message {
  sender: "advisor" | "user";
  text: string;
}

interface Topic {
  id: string;
  label: string;
  reply: string;
}

const topics: Topic[] = [
  {
    id: "caixa",
    label: "Fluxo de caixa desorganizado",
    reply:
      "Isso é mais comum do que parece — e o primeiro passo pra resolver é enxergar com clareza onde o dinheiro está entrando e saindo.",
  },
  {
    id: "indicadores",
    label: "Falta de indicadores confiáveis",
    reply:
      "Sem números confiáveis fica difícil tomar decisão com segurança. Isso dá pra organizar rapidinho.",
  },
  {
    id: "crescimento",
    label: "Dificuldade para planejar o crescimento",
    reply:
      "Crescer sem planejamento financeiro é arriscado. O ideal é entender onde sua empresa está hoje pra planejar os próximos passos com segurança.",
  },
  {
    id: "saude",
    label: "Não sei se minha empresa está saudável financeiramente",
    reply: "Essa é exatamente a pergunta que a gente responde em poucos minutos.",
  },
];

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "topic" | "cta">("intro");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      if (messages.length === 0) {
        startChat();
      }
    };
    window.addEventListener("open-chat-assistant", handleOpen);
    return () => window.removeEventListener("open-chat-assistant", handleOpen);
  }, [messages]);

  const startChat = () => {
    setMessages([
      { sender: "advisor", text: "Olá! 👋 Que bom ter você por aqui." },
      {
        sender: "advisor",
        text: "Sou o assistente virtual da SP2M. Consigo te ajudar a entender rapidinho como está a saúde financeira da sua empresa.",
      },
      { sender: "advisor", text: "Me conta, o que mais tem te incomodado na gestão financeira hoje?" },
    ]);
    setStep("topic");
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      startChat();
    }
  };

  const handleSelectTopic = (topic: Topic) => {
    setMessages((prev) => [...prev, { sender: "user", text: topic.label }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { sender: "advisor", text: topic.reply },
        { sender: "advisor", text: "Podemos ajudar você a resolver isso agora mesmo. Bora começar?" },
      ]);
      setStep("cta");
    }, 900);
  };

  const handleMoreQuestions = () => {
    setMessages((prev) => [...prev, { sender: "user", text: "Tenho outra dúvida" }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { sender: "advisor", text: "Claro! Me conta mais sobre o que está pegando na gestão financeira:" },
      ]);
      setStep("topic");
    }, 700);
  };

  const handleGoToDiagnostic = () => {
    window.dispatchEvent(new CustomEvent("open-diagnostic"));
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col items-end">
      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-full max-w-[360px] sm:max-w-[400px] h-[500px] sm:h-[550px] mb-4 rounded-2xl overflow-hidden border border-white/10 bg-[#030d1e]/95 backdrop-blur-xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#01040e] border-b border-white/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={specialistAvatar}
                  alt="Especialista SP2M"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover border border-gold/30 shadow-md"
                />
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                    Assistente SP2M
                  </p>
                  <h4 className="text-sm font-display font-medium text-white">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 align-middle" />
                    Online agora
                  </h4>
                </div>
              </div>
              <button
                onClick={handleToggle}
                className="p-1.5 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[80%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gold text-navy-deep font-medium rounded-tr-none"
                        : "bg-white/[0.05] border border-white/5 text-white/90 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col max-w-[80%] mr-auto items-start">
                  <div className="rounded-2xl rounded-tl-none bg-white/[0.05] border border-white/5 px-4 py-3 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* User Input Options */}
            <div className="p-4 border-t border-white/5 bg-[#01040e]/40">
              {step === "topic" && !isTyping && (
                <div className="flex flex-col gap-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleSelectTopic(topic)}
                      className="text-xs text-left bg-white/[0.05] border border-white/8 hover:border-gold/50 hover:bg-white/10 text-white/90 px-4 py-3 rounded-xl transition-all duration-200"
                    >
                      {topic.label}
                    </button>
                  ))}
                  <button
                    onClick={handleGoToDiagnostic}
                    className="text-xs text-left bg-gold/10 border border-gold/30 hover:border-gold/60 hover:bg-gold/15 text-gold-soft px-4 py-3 rounded-xl transition-all duration-200 font-medium"
                  >
                    Prefiro fazer o diagnóstico agora
                  </button>
                </div>
              )}

              {step === "cta" && !isTyping && (
                <div className="space-y-2">
                  <button
                    onClick={handleGoToDiagnostic}
                    className="w-full bg-gold text-navy-deep text-sm font-semibold py-3.5 rounded-xl hover:bg-gold-soft transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(218,158,63,0.3)]"
                  >
                    <Gauge className="h-4 w-4" />
                    Fazer diagnóstico agora
                  </button>
                  <button
                    onClick={handleMoreQuestions}
                    className="w-full text-xs text-white/50 hover:text-white/80 py-1.5 transition-colors flex items-center justify-center gap-1"
                  >
                    Tenho outra dúvida antes <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Trigger Button */}
      <button
        onClick={handleToggle}
        aria-label="Abrir assistente de diagnóstico"
        className={`h-14 w-14 rounded-full overflow-hidden flex items-center justify-center text-gold cursor-pointer transition-all duration-300 border border-gold/30 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(218,158,63,0.25)] ${
          isOpen ? "bg-[#01040e] rotate-90 border-white/10" : "bg-[#030d1e] hover:shadow-[0_8px_32px_rgba(218,158,63,0.4)]"
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <img src={specialistAvatar} alt="Assistente SP2M" width={56} height={56} className="h-full w-full object-cover" />
        )}
      </button>
    </div>
  );
}
