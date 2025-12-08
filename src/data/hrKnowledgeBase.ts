// Base de Conhecimento de RH para a AIRA
// Extraído de documentos acadêmicos e pesquisas de mercado

export const hrKnowledgeBase = {
  // Gestão por Competências (CHA)
  competencias: {
    definicao: "Competência = Conhecimentos + Habilidades + Atitudes (CHA)",
    tipos: {
      conhecimentos: "Saber técnico - formação, cursos, certificações",
      habilidades: "Saber fazer - aptidões práticas demonstráveis",
      atitudes: "Querer fazer - postura, motivação, comprometimento"
    },
    categorias: {
      tecnicas: [
        "Domínio de ferramentas específicas",
        "Conhecimento técnico da área",
        "Certificações profissionais",
        "Idiomas",
        "Metodologias de trabalho"
      ],
      comportamentais: [
        "Comunicação",
        "Trabalho em equipe",
        "Liderança",
        "Resolução de problemas",
        "Adaptabilidade",
        "Inteligência emocional",
        "Proatividade",
        "Criatividade",
        "Resiliência",
        "Organização"
      ]
    },
    maisValorizadas2024: [
      "Comunicação assertiva",
      "Adaptabilidade/flexibilidade",
      "Trabalho em equipe",
      "Resolução de problemas complexos",
      "Pensamento crítico",
      "Liderança situacional",
      "Inteligência emocional",
      "Habilidades digitais",
      "Gestão do tempo",
      "Aprendizado contínuo"
    ]
  },

  // Recrutamento e Seleção
  recrutamentoSelecao: {
    etapas: [
      "Triagem de currículos (90% eliminados nesta fase)",
      "Entrevista de RH",
      "Testes técnicos e comportamentais",
      "Entrevista com gestor",
      "Dinâmica de grupo (quando aplicável)",
      "Proposta e contratação"
    ],
    oQueRecrutadoresBuscam: [
      "Palavras-chave alinhadas à vaga (ATS)",
      "Resultados quantificáveis",
      "Progressão de carreira coerente",
      "Estabilidade adequada",
      "Competências técnicas e comportamentais",
      "Formação relevante",
      "Diferenciais competitivos"
    ],
    tempoMedioAnalise: "6-30 segundos por currículo na triagem inicial",
    sistemasATS: {
      importancia: "Muitas empresas usam sistemas automatizados de triagem",
      comoOtimizar: [
        "Usar palavras-chave da descrição da vaga",
        "Formato limpo e legível por sistemas",
        "Evitar tabelas complexas e imagens",
        "Usar títulos de seção padrão",
        "Incluir competências explicitamente"
      ]
    },
    tiposEntrevista: [
      "Estruturada (perguntas padronizadas)",
      "Não-estruturada (livre)",
      "Por competências (STAR)",
      "Técnica",
      "Situacional/Case"
    ]
  },

  // Análise e Descrição de Cargos
  analiseCargos: {
    elementos: {
      titulo: "Nome do cargo claro e padronizado",
      resumo: "Descrição geral da função",
      responsabilidades: "Atividades principais do cargo",
      requisitos: "Formação, experiência, conhecimentos necessários",
      competencias: "Habilidades técnicas e comportamentais",
      hierarquia: "Posição no organograma"
    },
    niveisCarreira: {
      estagiario: {
        experiencia: "Sem experiência prévia",
        foco: "Aprendizado e desenvolvimento",
        responsabilidades: "Atividades supervisionadas"
      },
      junior: {
        experiencia: "0-2 anos",
        foco: "Execução de tarefas definidas",
        responsabilidades: "Atividades operacionais com supervisão"
      },
      pleno: {
        experiencia: "2-5 anos",
        foco: "Autonomia e resolução de problemas",
        responsabilidades: "Projetos de média complexidade"
      },
      senior: {
        experiencia: "5+ anos",
        foco: "Liderança técnica e mentoria",
        responsabilidades: "Projetos complexos, decisões estratégicas"
      },
      especialista: {
        experiencia: "7+ anos",
        foco: "Expertise profunda em área específica",
        responsabilidades: "Referência técnica, inovação"
      },
      coordenador: {
        experiencia: "5+ anos + gestão",
        foco: "Gestão de equipe pequena",
        responsabilidades: "Coordenação de projetos e pessoas"
      },
      gerente: {
        experiencia: "7+ anos + gestão",
        foco: "Gestão estratégica de área",
        responsabilidades: "Resultados da área, desenvolvimento de equipe"
      }
    }
  },

  // Avaliação de Desempenho
  avaliacaoDesempenho: {
    fatoresAvaliados: [
      "Produção (quantidade de trabalho)",
      "Qualidade (precisão, atenção aos detalhes)",
      "Conhecimento do trabalho",
      "Cooperação e trabalho em equipe",
      "Criatividade e inovação",
      "Realização de metas",
      "Liderança (quando aplicável)",
      "Comunicação",
      "Pontualidade e assiduidade",
      "Iniciativa e proatividade"
    ],
    metodos: [
      "Autoavaliação",
      "Avaliação 90° (gestor)",
      "Avaliação 180° (gestor + pares)",
      "Avaliação 360° (todos os stakeholders)",
      "OKRs e KPIs",
      "Feedback contínuo"
    ],
    comoDestacarNoCV: [
      "Usar métricas e números específicos",
      "Mostrar evolução e crescimento",
      "Incluir prêmios e reconhecimentos",
      "Demonstrar impacto nos resultados",
      "Usar verbos de ação no passado"
    ]
  },

  // Treinamento e Desenvolvimento
  treinamentoDesenvolvimento: {
    tipos: [
      "Treinamento técnico",
      "Desenvolvimento comportamental",
      "Onboarding",
      "Reciclagem",
      "Desenvolvimento de liderança",
      "Mentoria e coaching"
    ],
    tendencias: [
      "Microlearning",
      "Gamificação",
      "E-learning e plataformas digitais",
      "Aprendizagem social",
      "Trilhas de carreira personalizadas"
    ],
    importanciaNoCV: "Destacar cursos, certificações e desenvolvimento contínuo demonstra proatividade e atualização"
  },

  // Tendências do Mercado 2023/2024
  tendenciasMercado: {
    modelosTrabalho: {
      hibrido: "Modelo mais desejado pelos profissionais (56%)",
      remoto: "Continua relevante para posições tech",
      presencial: "Retorno gradual, especialmente liderança"
    },
    prioridades: [
      "Employee experience",
      "Diversidade e inclusão",
      "Saúde mental e bem-estar",
      "Employer branding",
      "People analytics",
      "Desenvolvimento de liderança",
      "Cultura organizacional"
    ],
    beneficiosMaisValorizados: [
      "Flexibilidade de horário",
      "Home office/híbrido",
      "Plano de saúde",
      "Desenvolvimento profissional",
      "Ambiente de trabalho saudável",
      "Propósito e valores alinhados"
    ],
    desafiosRH: [
      "Retenção de talentos (65%)",
      "Desenvolvimento de liderança (51%)",
      "Saúde mental dos colaboradores (46%)",
      "Engajamento de equipes remotas",
      "Atração de talentos qualificados"
    ],
    setoresEmAlta: [
      "Tecnologia e Digital",
      "Saúde",
      "E-commerce",
      "Energia renovável",
      "Finanças/Fintechs",
      "Agronegócio"
    ]
  },

  // Estrutura Ideal do Currículo
  estruturaCurriculo: {
    secoes: {
      cabecalho: {
        itens: ["Nome completo", "Contato (telefone, email)", "LinkedIn", "Localização"],
        dica: "Não incluir idade, estado civil, foto (exceto se solicitado)"
      },
      resumoProfissional: {
        linhas: "3-4 linhas",
        conteudo: "Experiência total, especialização, principais conquistas, objetivo",
        dica: "Adaptar para cada vaga"
      },
      experiencia: {
        formato: "Cargo | Empresa | Período",
        conteudo: "Responsabilidades e conquistas com métricas",
        dica: "Usar verbos de ação, focar em resultados"
      },
      formacao: {
        itens: ["Curso | Instituição | Ano de conclusão"],
        dica: "Incluir cursos relevantes e certificações"
      },
      competencias: {
        tipos: ["Técnicas", "Comportamentais", "Idiomas"],
        dica: "Alinhar com palavras-chave da vaga"
      },
      adicional: {
        itens: ["Projetos", "Voluntariado", "Publicações", "Prêmios"],
        dica: "Incluir apenas se relevante"
      }
    },
    formatacao: {
      tamanho: "1-2 páginas (ideal: 1 para júnior, 2 para sênior+)",
      fonte: "Profissional e legível (Arial, Calibri, Helvetica)",
      margens: "Adequadas, não apertadas",
      organizacao: "Cronológica reversa (mais recente primeiro)"
    },
    verbosDeAcao: [
      "Desenvolvi", "Implementei", "Gerenciei", "Liderei",
      "Aumentei", "Reduzi", "Otimizei", "Criei",
      "Coordenei", "Negociei", "Supervisionei", "Automatizei",
      "Reestruturei", "Lancei", "Conquistei", "Entreguei"
    ]
  },

  // Erros Comuns a Evitar
  errosComuns: [
    "Informações genéricas sem resultados específicos",
    "Erros de português e formatação",
    "Currículo muito longo ou muito curto",
    "Mentiras ou exageros",
    "Falta de palavras-chave relevantes",
    "Email não profissional",
    "Informações desatualizadas",
    "Falta de foco na vaga pretendida",
    "Excesso de informações pessoais",
    "Layout confuso ou amador",
    "Não quantificar resultados",
    "Copiar modelo sem personalizar"
  ],

  // Dicas por Área
  dicasPorArea: {
    tecnologia: {
      destacar: ["Stack técnica", "Projetos no GitHub", "Metodologias ágeis", "Certificações cloud"],
      formato: "Pode ser mais criativo, destacar projetos"
    },
    comercial: {
      destacar: ["Metas atingidas", "Volume de vendas", "Carteira de clientes", "Negociações"],
      formato: "Foco em números e resultados comerciais"
    },
    financeiro: {
      destacar: ["Certificações (CPA, CEA)", "Valores gerenciados", "Reduções de custo", "Compliance"],
      formato: "Conservador, preciso, detalhado"
    },
    marketing: {
      destacar: ["Campanhas", "ROI", "Crescimento de métricas", "Portfolio"],
      formato: "Pode ser criativo, link para portfólio"
    },
    rh: {
      destacar: ["Número de contratações", "Programas implementados", "Redução de turnover"],
      formato: "Equilibrado, demonstrar empatia"
    },
    operacoes: {
      destacar: ["Eficiência operacional", "Reduções de custo", "Otimização de processos"],
      formato: "Foco em métricas de eficiência"
    }
  }
};

// Prompt de expertise em RH para a AIRA
export const HR_EXPERT_KNOWLEDGE = `
📚 CONHECIMENTO ESPECIALIZADO EM RH E CARREIRA:

🎯 COMPETÊNCIAS (Modelo CHA):
- Conhecimentos: saber técnico, formação acadêmica, certificações
- Habilidades: saber fazer, aptidões práticas demonstráveis
- Atitudes: querer fazer, postura profissional, motivação

As competências mais valorizadas em 2024:
1. Comunicação assertiva
2. Adaptabilidade e flexibilidade
3. Resolução de problemas complexos
4. Pensamento crítico
5. Inteligência emocional
6. Habilidades digitais
7. Trabalho em equipe
8. Liderança situacional
9. Gestão do tempo
10. Aprendizado contínuo

👔 O QUE RECRUTADORES AVALIAM (em 6-30 segundos):
- Palavras-chave alinhadas à vaga (sistemas ATS filtram currículos)
- Resultados quantificáveis (aumentou X%, reduziu Y%, gerenciou Z)
- Progressão de carreira coerente
- Competências técnicas E comportamentais
- Formatação limpa e profissional

📊 NÍVEIS DE CARREIRA:
- Júnior (0-2 anos): execução, aprendizado, supervisão próxima
- Pleno (2-5 anos): autonomia, projetos de média complexidade
- Sênior (5+ anos): liderança técnica, mentoria, decisões estratégicas
- Especialista: expertise profunda, referência técnica
- Gestão: coordenação de pessoas e resultados de área

📈 TENDÊNCIAS DO MERCADO 2024:
- Modelo híbrido é o mais desejado (56% dos profissionais)
- Diversidade e inclusão são diferenciais
- Saúde mental e bem-estar são prioridades
- Habilidades digitais são essenciais em todas as áreas
- Aprendizado contínuo é esperado

📝 ESTRUTURA IDEAL DO CURRÍCULO:
1. Cabeçalho: nome, contato, LinkedIn, localização
2. Resumo Profissional: 3-4 linhas com experiência, especialização e objetivo
3. Experiência: cargo, empresa, período + realizações com métricas
4. Formação: curso, instituição, ano
5. Competências: técnicas + comportamentais + idiomas
6. Adicional: certificações, projetos, voluntariado (se relevante)

✨ VERBOS DE AÇÃO PARA EXPERIÊNCIAS:
Desenvolvi, Implementei, Gerenciei, Liderei, Aumentei, Reduzi, Otimizei, 
Criei, Coordenei, Negociei, Automatizei, Reestruturei, Lancei, Conquistei

❌ ERROS COMUNS A EVITAR:
- Informações genéricas sem resultados específicos
- Currículo não adaptado à vaga
- Falta de palavras-chave (ATS não encontra)
- Não quantificar conquistas
- Excesso de informações irrelevantes
- Layout confuso ou amador

🎯 AO ANALISAR UMA VAGA, IDENTIFIQUE:
- Palavras-chave obrigatórias (requisitos)
- Competências técnicas pedidas
- Competências comportamentais implícitas
- Nível de senioridade
- Cultura da empresa (se mencionada)
`;

export default hrKnowledgeBase;
