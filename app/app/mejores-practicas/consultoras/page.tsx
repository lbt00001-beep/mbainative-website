'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './consultoras.module.css';

interface Article {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
    sourceId: string;
}

interface Consultora {
    id: string;
    name: string;
    logo: string;
    website: string;
    articleCount: number;
}

interface ConsultorasData {
    lastUpdated: string;
    totalArticles: number;
    consultoras: Consultora[];
    articles: Article[];
}

export default function ConsultorasPage() {
    const [data, setData] = useState<ConsultorasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedConsultora, setSelectedConsultora] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/data/consultoras.json');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error('Error loading consultoras data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredArticles = selectedConsultora
        ? data?.articles.filter(a => a.sourceId === selectedConsultora)
        : data?.articles;

    return (
        <section className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/mejores-practicas" className={styles.backLink}>
                    ← Mejores Prácticas
                </Link>
                <h1 className={styles.title}>
                    <span className={styles.accent}>Consultoras</span> y el Futuro del Trabajo
                </h1>
                <p className={styles.subtitle}>
                    Análisis de McKinsey, BCG y Deloitte sobre el impacto de la IA en el mercado laboral y la organización empresarial.
                </p>
                {data && (
                    <p className={styles.updated}>
                        Actualizado: {formatDate(data.lastUpdated)} · {data.totalArticles} artículos
                    </p>
                )}
            </div>

            {/* Consultora Logos */}
            <div className={styles.logoGrid}>
                <button
                    className={`${styles.logoCard} ${!selectedConsultora ? styles.active : ''}`}
                    onClick={() => setSelectedConsultora(null)}
                >
                    <span className={styles.logoText}>Todas</span>
                </button>
                {data?.consultoras.map(consultora => (
                    <button
                        key={consultora.id}
                        className={`${styles.logoCard} ${selectedConsultora === consultora.id ? styles.active : ''}`}
                        onClick={() => setSelectedConsultora(consultora.id)}
                    >
                        <span className={styles.logoText}>{consultora.name}</span>
                        <span className={styles.articleCount}>{consultora.articleCount}</span>
                    </button>
                ))}
            </div>

            {/* Articles List */}
            {loading ? (
                <p className={styles.loading}>Cargando artículos...</p>
            ) : (
                <div className={styles.articleGrid}>
                    {filteredArticles?.map((article, idx) => (
                        <a
                            key={idx}
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.articleCard}
                        >
                            <span className={styles.source}>{article.source}</span>
                            <h3 className={styles.articleTitle}>{article.title}</h3>
                            <p className={styles.articleDesc}>{article.description}</p>
                            <span className={styles.articleDate}>{formatDate(article.pubDate)}</span>
                        </a>
                    ))}
                </div>
            )}

            {/* CTA */}
            <div className={styles.cta}>
                <Link href="/mejores-practicas/doctrinas" className={styles.ctaButton}>
                    Ver los 20 Principios AI-Nativos →
                </Link>
            </div>
        </section>
    );
}
