'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './youtubers.module.css';

interface Video {
    videoId: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
}

interface Youtuber {
    name: string;
    description: string;
    photo: string;
    channelUrl?: string;
    videos: Video[];
}

interface YoutubersData {
    lastUpdated: string;
    youtubers: { [key: string]: Youtuber };
}

export default function YoutubersPage() {
    const [data, setData] = useState<YoutubersData | null>(null);
    const [selectedYoutuber, setSelectedYoutuber] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/data/youtubers.json');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                    // Select first youtuber by default
                    const keys = Object.keys(json.youtubers);
                    if (keys.length > 0) {
                        setSelectedYoutuber(keys[0]);
                    }
                }
            } catch (err) {
                console.error('Could not load youtubers:', err);
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

    if (loading) {
        return (
            <section className={styles.container}>
                <div className={styles.header}>
                    <Link href="/mejores-practicas" className={styles.backLink}>
                        ← Mejores Prácticas
                    </Link>
                    <h1 className={styles.title}>Cargando...</h1>
                </div>
            </section>
        );
    }

    if (!data) {
        return (
            <section className={styles.container}>
                <div className={styles.header}>
                    <Link href="/mejores-practicas" className={styles.backLink}>
                        ← Mejores Prácticas
                    </Link>
                    <h1 className={styles.title}>Error al cargar los datos</h1>
                </div>
            </section>
        );
    }

    const youtuberKeys = Object.keys(data.youtubers);
    const currentYoutuber = selectedYoutuber ? data.youtubers[selectedYoutuber] : null;

    return (
        <section className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/mejores-practicas" className={styles.backLink}>
                    ← Mejores Prácticas
                </Link>
                <h1 className={styles.title}>
                    📺 <span className={styles.accent}>Youtubers</span> de Referencia
                </h1>
                <p className={styles.subtitle}>
                    Los mejores canales de YouTube sobre Inteligencia Artificial,
                    tecnología y el futuro del trabajo.
                </p>
                <p className={styles.updated}>
                    Actualizado: {formatDate(data.lastUpdated)}
                </p>
            </div>

            {/* Youtuber Tabs */}
            <div className={styles.tabs}>
                {youtuberKeys.map((key) => {
                    const youtuber = data.youtubers[key];
                    return (
                        <button
                            key={key}
                            className={`${styles.tab} ${selectedYoutuber === key ? styles.tabActive : ''}`}
                            onClick={() => setSelectedYoutuber(key)}
                        >
                            <img
                                src={youtuber.photo}
                                alt={youtuber.name}
                                className={styles.tabPhoto}
                                onError={(e) => {
                                    e.currentTarget.src = '/images/placeholder-guru.jpg';
                                }}
                            />
                            <span>{youtuber.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Current Youtuber Info */}
            {currentYoutuber && (
                <div className={styles.youtuberInfo}>
                    <p className={styles.youtuberDescription}>{currentYoutuber.description}</p>
                    {currentYoutuber.channelUrl && (
                        <a
                            href={currentYoutuber.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.channelLink}
                        >
                            Ver canal en YouTube →
                        </a>
                    )}
                </div>
            )}

            {/* Videos Grid */}
            {currentYoutuber && currentYoutuber.videos.length > 0 ? (
                <div className={styles.videosGrid}>
                    {currentYoutuber.videos
                        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                        .map((video) => (
                            <a
                                key={video.videoId}
                                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.videoCard}
                            >
                                <div className={styles.thumbnailWrapper}>
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className={styles.thumbnail}
                                    />
                                    <div className={styles.playButton}>▶</div>
                                </div>
                                <div className={styles.videoInfo}>
                                    <h3 className={styles.videoTitle}>{video.title}</h3>
                                    <p className={styles.videoDate}>{formatDate(video.publishedAt)}</p>
                                </div>
                            </a>
                        ))}
                </div>
            ) : (
                <div className={styles.noVideos}>
                    <p>No hay videos disponibles en este momento.</p>
                </div>
            )}

            {/* CTA */}
            <div className={styles.cta}>
                <Link href="/mejores-practicas/gurus" className={styles.ctaButton}>
                    Ver los 14 Gurús de la IA →
                </Link>
            </div>
        </section>
    );
}
