// Data: 14 AI Gurus with static profiles
// Videos will be fetched dynamically from YouTube

export interface Guru {
    id: string;
    name: string;
    title: string;
    company: string;
    photo: string;
    bio: string;
    twitter?: string;
    searchQuery: string;
    doctrines: number[];
}

export const GURUS: Guru[] = [
    {
        id: "demis-hassabis",
        name: "Demis Hassabis",
        title: "CEO & Co-founder",
        company: "Google DeepMind",
        photo: "/images/gurus/demis-hassabis.jpg",
        bio: "Neurocientífico y programador. Creó AlphaGo, AlphaFold y lidera la visión de AGI en DeepMind. Nobel de Química 2024 por AlphaFold.",
        twitter: "demishassabis",
        searchQuery: "Demis Hassabis AI interview",
        doctrines: [1, 9]
    },
    {
        id: "yann-lecun",
        name: "Yann LeCun",
        title: "Chief AI Scientist",
        company: "Meta",
        photo: "/images/gurus/yann-lecun.jpg",
        bio: "Pionero del deep learning. Inventó las redes convolucionales (CNNs). Turing Award 2018. Defiende JEPA y world models frente a LLMs.",
        twitter: "ylecun",
        searchQuery: "Yann LeCun AI lecture",
        doctrines: [3]
    },
    {
        id: "yoshua-bengio",
        name: "Yoshua Bengio",
        title: "Scientific Director",
        company: "Mila",
        photo: "/images/gurus/yoshua-bengio.jpg",
        bio: "Padre del deep learning moderno. Turing Award 2018. Fundador de Mila. Voz prominente en riesgos existenciales de la IA.",
        twitter: "yoshuabengio",
        searchQuery: "Yoshua Bengio AI safety",
        doctrines: [7]
    },
    {
        id: "geoffrey-hinton",
        name: "Geoffrey Hinton",
        title: "Godfather of AI",
        company: "Ex-Google",
        photo: "/images/gurus/geoffrey-hinton.jpg",
        bio: "Inventor del backpropagation. Turing Award 2018. Dejó Google en 2023 para alertar sobre riesgos de IA. Nobel de Física 2024.",
        searchQuery: "Geoffrey Hinton AI warning",
        doctrines: [7]
    },
    {
        id: "gary-marcus",
        name: "Gary Marcus",
        title: "AI Critic & Researcher",
        company: "NYU / Independent",
        photo: "/images/gurus/gary-marcus.jpg",
        bio: "Científico cognitivo y emprendedor. Crítico del hype del deep learning. Aboga por enfoques híbridos neuro-simbólicos.",
        twitter: "garymarcus",
        searchQuery: "Gary Marcus AI criticism",
        doctrines: [1]
    },
    {
        id: "sam-altman",
        name: "Sam Altman",
        title: "CEO",
        company: "OpenAI",
        photo: "/images/gurus/sam-altman.jpg",
        bio: "Líder de OpenAI. Impulsó GPT-4, ChatGPT y la democratización de la IA. Visionario del escalado como camino a AGI.",
        twitter: "sama",
        searchQuery: "Sam Altman AI interview",
        doctrines: [1]
    },
    {
        id: "ilya-sutskever",
        name: "Ilya Sutskever",
        title: "Co-founder",
        company: "Safe Superintelligence (SSI)",
        photo: "/images/gurus/ilya-sutskever.jpg",
        bio: "Co-fundador de OpenAI, arquitecto de GPT. Dejó OpenAI en 2024 para fundar SSI, enfocada en superinteligencia segura.",
        searchQuery: "Ilya Sutskever AI interview",
        doctrines: [6]
    },
    {
        id: "dario-amodei",
        name: "Dario Amodei",
        title: "CEO",
        company: "Anthropic",
        photo: "/images/gurus/dario-amodei.jpg",
        bio: "Ex-VP de OpenAI. Fundó Anthropic con enfoque en AI safety. Creador de Claude y Constitutional AI.",
        twitter: "DarioAmodei",
        searchQuery: "Dario Amodei Anthropic interview",
        doctrines: [5]
    },
    {
        id: "karen-hao",
        name: "Karen Hao",
        title: "AI Correspondent",
        company: "The Atlantic",
        photo: "/images/gurus/karen-hao.jpg",
        bio: "Periodista especializada en IA. Investigaciones sobre ética, sesgos y poder en la industria. Voz crítica del sector.",
        twitter: "karendhao",
        searchQuery: "Karen Hao AI journalism",
        doctrines: [10]
    },
    {
        id: "mustafa-suleyman",
        name: "Mustafa Suleyman",
        title: "CEO Microsoft AI",
        company: "Microsoft",
        photo: "/images/gurus/mustafa-suleyman.jpg",
        bio: "Co-fundador de DeepMind. Fundó Inflection AI (Pi). Ahora lidera Microsoft AI. Autor de 'The Coming Wave'.",
        twitter: "mustaborafasul",
        searchQuery: "Mustafa Suleyman AI interview",
        doctrines: [2]
    },
    {
        id: "fei-fei-li",
        name: "Fei-Fei Li",
        title: "Co-Director Stanford HAI",
        company: "Stanford University",
        photo: "/images/gurus/fei-fei-li.jpg",
        bio: "Creadora de ImageNet, el dataset que catapultó el deep learning. Defensora de IA centrada en humanos y democratización.",
        twitter: "drfeifei",
        searchQuery: "Fei-Fei Li AI interview",
        doctrines: [8]
    },
    {
        id: "jensen-huang",
        name: "Jensen Huang",
        title: "CEO & Founder",
        company: "NVIDIA",
        photo: "/images/gurus/jensen-huang.jpg",
        bio: "Creó NVIDIA y las GPUs que potencian toda la IA moderna. Visionario de 'AI factories' como nueva infraestructura industrial.",
        searchQuery: "Jensen Huang NVIDIA AI",
        doctrines: [1, 2]
    },
    {
        id: "andrew-ng",
        name: "Andrew Ng",
        title: "Founder",
        company: "DeepLearning.AI / Coursera",
        photo: "/images/gurus/andrew-ng.jpg",
        bio: "Popularizó el ML con cursos online. Ex-Baidu, Stanford. Fundador de Coursera. Enfoque práctico y educativo.",
        twitter: "AndrewYNg",
        searchQuery: "Andrew Ng AI course lecture",
        doctrines: [8]
    },
    {
        id: "andrej-karpathy",
        name: "Andrej Karpathy",
        title: "AI Educator & Researcher",
        company: "Ex-Tesla, Ex-OpenAI",
        photo: "/images/gurus/andrej-karpathy.jpg",
        bio: "Lideró Tesla Autopilot y trabajó en OpenAI. Ahora crea contenido educativo de IA en YouTube. Altamente influyente.",
        twitter: "karpathy",
        searchQuery: "Andrej Karpathy AI tutorial",
        doctrines: [1]
    }
];

export const getGuruById = (id: string): Guru | undefined => {
    return GURUS.find(g => g.id === id);
};

export const getGurusByDoctrine = (doctrineId: number): Guru[] => {
    return GURUS.filter(g => g.doctrines.includes(doctrineId));
};
