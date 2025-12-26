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
    searchQuery: string; // For YouTube search
    doctrines: number[]; // Links to doctrine IDs
}

export const GURUS: Guru[] = [
    {
        id: "demis-hassabis",
        name: "Demis Hassabis",
        title: "CEO & Co-founder",
        company: "Google DeepMind",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Demis_Hassabis%2C_2024_%28cropped%29.jpg/220px-Demis_Hassabis%2C_2024_%28cropped%29.jpg",
        bio: "Neurocientífico y programador. Creó AlphaGo, AlphaFold y lidera la visión de AGI en DeepMind. Nobel de Química 2024 por AlphaFold.",
        twitter: "demaborsi",
        searchQuery: "Demis Hassabis AI interview",
        doctrines: [1, 9]
    },
    {
        id: "yann-lecun",
        name: "Yann LeCun",
        title: "Chief AI Scientist",
        company: "Meta",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Yann_LeCun_-_2018_%28cropped%29.jpg/220px-Yann_LeCun_-_2018_%28cropped%29.jpg",
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
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Yoshua_Bengio_-_2017_%28cropped%29.jpg/220px-Yoshua_Bengio_-_2017_%28cropped%29.jpg",
        bio: "Padre del deep learning moderno. Turing Award 2018. Fundador de Mila. Voz prominente en riesgos existenciales de la IA.",
        twitter: "yoshaborgio",
        searchQuery: "Yoshua Bengio AI safety",
        doctrines: [7]
    },
    {
        id: "geoffrey-hinton",
        name: "Geoffrey Hinton",
        title: "Godfather of AI",
        company: "Ex-Google",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Geoffrey_Hinton_at_UofT.jpg/220px-Geoffrey_Hinton_at_UofT.jpg",
        bio: "Inventor del backpropagation. Turing Award 2018. Dejó Google en 2023 para alertar sobre riesgos de IA. Nobel de Física 2024.",
        searchQuery: "Geoffrey Hinton AI warning",
        doctrines: [7]
    },
    {
        id: "gary-marcus",
        name: "Gary Marcus",
        title: "AI Critic & Researcher",
        company: "NYU / Independent",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/GaryMarcus.jpg/220px-GaryMarcus.jpg",
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
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sam_Altman_2024.jpg/220px-Sam_Altman_2024.jpg",
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
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Ilya_Sutskever_in_2023_%28cropped%29.jpg/220px-Ilya_Sutskever_in_2023_%28cropped%29.jpg",
        bio: "Co-fundador de OpenAI, arquitecto de GPT. Dejó OpenAI en 2024 para fundar SSI, enfocada exclusivamente en superinteligencia segura.",
        searchQuery: "Ilya Sutskever AI interview",
        doctrines: [6]
    },
    {
        id: "dario-amodei",
        name: "Dario Amodei",
        title: "CEO",
        company: "Anthropic",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Dario_Amodei%2C_2023_%28cropped%29.jpg/220px-Dario_Amodei%2C_2023_%28cropped%29.jpg",
        bio: "Ex-VP de OpenAI. Fundó Anthropic con enfoque en AI safety. Creador de Claude y Constitutional AI.",
        twitter: "DarioAmodei",
        searchQuery: "Dario Amodei Anthropic interview",
        doctrines: [5]
    },
    {
        id: "karen-hao",
        name: "Karen Hao",
        title: "AI Correspondent",
        company: "The Atlantic / Ex-MIT Tech Review",
        photo: "https://pbs.twimg.com/profile_images/1568668377977298944/kqAc4K9a_400x400.jpg",
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
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Mustafa_Suleyman_in_2018.jpg/220px-Mustafa_Suleyman_in_2018.jpg",
        bio: "Co-fundador de DeepMind. Fundó Inflection AI (Pi). Ahora lidera Microsoft AI. Autor de 'The Coming Wave'.",
        twitter: "mustaborsi",
        searchQuery: "Mustafa Suleyman AI interview",
        doctrines: [2]
    },
    {
        id: "fei-fei-li",
        name: "Fei-Fei Li",
        title: "Co-Director Stanford HAI",
        company: "Stanford University",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Fei-Fei_Li_at_AI_for_Good_2017.jpg/220px-Fei-Fei_Li_at_AI_for_Good_2017.jpg",
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
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Jensen_Huang_20240609_03_%28cropped%29.jpg/220px-Jensen_Huang_20240609_03_%28cropped%29.jpg",
        bio: "Creó NVIDIA y las GPUs que potencian toda la IA moderna. Visionario de 'AI factories' como nueva infraestructura industrial.",
        searchQuery: "Jensen Huang NVIDIA AI",
        doctrines: [1, 2]
    },
    {
        id: "andrew-ng",
        name: "Andrew Ng",
        title: "Founder",
        company: "DeepLearning.AI / Coursera",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Andrew_Ng.jpg/220px-Andrew_Ng.jpg",
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
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Andrej_Karpathy_2024_%28cropped%29.jpg/220px-Andrej_Karpathy_2024_%28cropped%29.jpg",
        bio: "Lideró Tesla Autopilot y trabajó en OpenAI. Ahora crea contenido educativo de IA en YouTube. Altamente influyente.",
        twitter: "karpathy",
        searchQuery: "Andrej Karpathy AI tutorial",
        doctrines: [1]
    }
];

// Get guru by ID
export const getGuruById = (id: string): Guru | undefined => {
    return GURUS.find(g => g.id === id);
};

// Get gurus by doctrine
export const getGurusByDoctrine = (doctrineId: number): Guru[] => {
    return GURUS.filter(g => g.doctrines.includes(doctrineId));
};
