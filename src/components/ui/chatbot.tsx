import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import cfoAvatar from '@/assets/cfo-avatar.webp';

interface Message {
  sender: 'bot' | 'user';
  text: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<
    'intro' | 'name' | 'segment' | 'revenue' | 'challenge' | 'contact' | 'success'
  >('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Lead data state
  const [lead, setLead] = useState({
    nome: '',
    cargo: '',
    segmento: '',
    faturamento: '',
    desafio: '',
    email: '',
    whatsapp: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open chatbot globally via custom event (e.g. from Hero CTA)
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      if (messages.length === 0) {
        startChat();
      }
    };
    window.addEventListener('open-chatbot', handleOpen);
    return () => window.removeEventListener('open-chatbot', handleOpen);
  }, [messages]);

  const startChat = () => {
    setMessages([
      { sender: 'bot', text: 'Olá! Seja muito bem-vindo à SP2M Inteligência Empresarial.' },
      { sender: 'bot', text: 'Eu sou o seu CFO Virtual. Vou te ajudar a estruturar um diagnóstico financeiro rápido para a sua empresa.' },
      { sender: 'bot', text: 'Para começarmos, qual o seu nome completo e seu cargo atual?' }
    ]);
    setStep('name');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      startChat();
    }
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');

    if (step === 'name') {
      // Parse name and role (Simple split by comma or take whole text as name)
      const parts = userText.split(',');
      const nomeParsed = parts[0]?.trim() || '';
      const cargoParsed = parts[1]?.trim() || 'Sócio/Diretor';
      
      setLead((prev) => ({ ...prev, nome: nomeParsed, cargo: cargoParsed }));
      
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: `Prazer em falar com você, ${nomeParsed}!` },
          { sender: 'bot', text: 'Qual é o principal setor ou segmento de atuação da sua empresa?' }
        ]);
        setStep('segment');
      }, 800);
    } else if (step === 'contact') {
      // If user typed contact info in manual text (normally handles via inputs form)
      setLead((prev) => ({ ...prev, email: userText }));
      setStep('success');
    }
  };

  const handleSelectOption = (field: 'segmento' | 'faturamento' | 'desafio', option: string) => {
    setLead((prev) => ({ ...prev, [field]: option }));
    setMessages((prev) => [...prev, { sender: 'user', text: option }]);

    setTimeout(() => {
      if (field === 'segmento') {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Excelente. Para direcionarmos ao nível de relatórios gerenciais e assessoria ideal:' },
          { sender: 'bot', text: 'Qual a faixa de faturamento mensal aproximada da sua empresa?' }
        ]);
        setStep('revenue');
      } else if (field === 'faturamento') {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Perfeito. E hoje, qual o maior desafio ou gargalo financeiro que impede sua empresa de crescer de forma organizada?' }
        ]);
        setStep('challenge');
      } else if (field === 'desafio') {
        const tier = getSP2MTier(lead.faturamento);
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: `Agradeço pelas informações. Com base no seu faturamento e setor, a jornada ideal para o seu negócio é o ${tier}.` },
          { sender: 'bot', text: 'Para que um CFO sênior elabore o seu diagnóstico prévio gratuito, por favor informe seus dados de contato:' }
        ]);
        setStep('contact');
      }
    }, 800);
  };

  const getSP2MTier = (revenue: string) => {
    if (revenue.includes('100 mil')) return 'SP2M Inicial';
    if (revenue.includes('500 mil')) return 'SP2M Essencial';
    if (revenue.includes('2 milhões')) return 'SP2M Crescimento';
    return 'SP2M Executivo';
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.email || !lead.whatsapp) return;

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: `E-mail: ${lead.email} | WhatsApp: ${lead.whatsapp}` }
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Pronto! Seu diagnóstico foi qualificado e registrado com sucesso.' },
        { sender: 'bot', text: 'Clique no botão abaixo para iniciar seu atendimento prioritário no WhatsApp com o consultor sênior responsável. Já compartilhamos suas respostas!' }
      ]);
      setStep('success');
    }, 800);
  };

  const startWhatsAppHandoff = () => {
    const tier = getSP2MTier(lead.faturamento);
    const text = encodeURIComponent(
      `Olá SP2M! Realizei o diagnóstico estratégico com o CFO Virtual.\n\n` +
      `👤 *Lead:* ${lead.nome} (${lead.cargo})\n` +
      `🏢 *Segmento:* ${lead.segmento}\n` +
      `💰 *Faturamento:* ${lead.faturamento} (${tier})\n` +
      `🎯 *Dor Principal:* ${lead.desafio}\n` +
      `✉️ *E-mail:* ${lead.email}\n` +
      `📱 *WhatsApp:* ${lead.whatsapp}`
    );
    window.open(`https://wa.me/5581992781366?text=${text}`, '_blank');
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
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-full max-w-[360px] sm:max-w-[400px] h-[500px] sm:h-[550px] mb-4 rounded-2xl overflow-hidden border border-white/10 bg-[#030d1e]/95 backdrop-blur-xl shadow-2xl flex flex-col"
          >
          
          {/* Header */}
          <div className="bg-[#01040e] border-b border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={cfoAvatar}
                alt="CFO Virtual Avatar"
                className="h-9 w-9 rounded-full object-cover border border-gold/30 shadow-md"
              />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Assistente Virtual</p>
                <h4 className="text-sm font-display font-medium text-white">CFO Virtual SP2M</h4>
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
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gold text-navy-deep font-medium rounded-tr-none'
                      : 'bg-white/[0.05] border border-white/5 text-white/90 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* User Input Options and Forms */}
          <div className="p-4 border-t border-white/5 bg-[#01040e]/40">
            {step === 'name' && (
              <form onSubmit={handleSendText} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Seu nome, cargo (Ex: André, CEO)"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/50 focus:bg-white/[0.06]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="h-11 w-11 shrink-0 rounded-xl bg-gold text-navy-deep flex items-center justify-center font-bold hover:bg-gold-soft transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}

            {step === 'segment' && (
              <div className="flex flex-wrap gap-2">
                {[
                  'Tecnologia / SaaS',
                  'Serviços',
                  'Varejo / E-commerce',
                  'Saúde / Clínicas',
                  'Construção Civil',
                  'Indústria / Agro',
                  'Outros'
                ].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption('segmento', opt)}
                    className="text-xs bg-white/[0.05] border border-white/8 hover:border-gold/50 hover:bg-white/10 text-white/90 px-3.5 py-2.5 rounded-full transition-all duration-200"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {step === 'revenue' && (
              <div className="flex flex-col gap-2">
                {[
                  'Até R$ 100 mil/mês',
                  'De R$ 100 mil a R$ 500 mil/mês',
                  'De R$ 500 mil a R$ 2 milhões/mês',
                  'Acima de R$ 2 milhões/mês'
                ].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption('faturamento', opt)}
                    className="text-xs text-left bg-white/[0.05] border border-white/8 hover:border-gold/50 hover:bg-white/10 text-white/90 px-4 py-3 rounded-xl transition-all duration-200"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {step === 'challenge' && (
              <div className="flex flex-col gap-2">
                {[
                  'Falta de previsibilidade de caixa',
                  'Falta de indicadores e KPIs de BI',
                  'Contas a pagar/receber desorganizadas',
                  'Dificuldade para planejar investimentos',
                  'Outro desafio financeiro'
                ].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption('desafio', opt)}
                    className="text-xs text-left bg-white/[0.05] border border-white/8 hover:border-gold/50 hover:bg-white/10 text-white/90 px-4 py-3 rounded-xl transition-all duration-200"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {step === 'contact' && (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Seu melhor E-mail"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-gold/50 focus:bg-white/[0.06]"
                />
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp com DDD"
                  value={lead.whatsapp}
                  onChange={(e) => setLead({ ...lead, whatsapp: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-gold/50 focus:bg-white/[0.06]"
                />
                <button
                  type="submit"
                  className="w-full bg-gold text-navy-deep text-xs font-semibold py-3 rounded-xl hover:bg-gold-soft transition-colors flex items-center justify-center gap-2"
                >
                  Continuar Diagnóstico <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}

            {step === 'success' && (
              <button
                onClick={startWhatsAppHandoff}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
              >
                Falar com Consultor Sênior <Check className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Floating Chat Trigger Button */}
      <button
        onClick={handleToggle}
        className={`h-14 w-14 rounded-full overflow-hidden flex items-center justify-center text-gold cursor-pointer transition-all duration-300 border border-gold/30 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(218,158,63,0.25)] ${
          isOpen ? 'bg-[#01040e] rotate-90 border-white/10' : 'bg-[#030d1e] hover:shadow-[0_8px_32px_rgba(218,158,63,0.4)]'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <img src={cfoAvatar} alt="CFO Virtual" className="h-full w-full object-cover" />
        )}
      </button>

    </div>
  );
}
