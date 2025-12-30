'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GURUS, type Guru } from '@/data/gurus';
import { DOCTRINES } from '@/data/doctrines';
import styles from './gurus.module.css';

interface VideoData {
    videoId: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
    channelTitle: string;
}

interface GurusVideos {
    lastUpdated: string;
    totalVideos: number;
    gurus: { [key: string]: VideoData[] };
}

export default function GurusPage() {
    const [videos, setVideos] = useState<GurusVideos | null>(null);
    const [selectedGuru, setSelectedGuru] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await fetch('/data/gurus-videos.json');
                if (res.ok) {
                    const data = await res.json();
                    setVideos(data);
                }
            } catch (err) {
                console.error('Could not load videos:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getGuruDoctrines = (guru: Guru) => {
        return guru.doctrines.map(id => DOCTRINES.find(d => d.id === id)).filter(Boolean);
    };

    return (
        <section className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/mejores-practicas" className={styles.backLink}>
                    ← Mejores Prácticas
                </Link>
                <h1 className={styles.title}>
                    ¿Qué dicen los <span className={styles.accent}>Gurús de la IA</span>?
                </h1>
                <p className={styles.subtitle}>
                    14 líderes que definen el futuro de la Inteligencia Artificial.
                    Sus visiones, sus debates y sus últimos vídeos.
                </p>
                {videos && (
                    <p className={styles.updated}>
                        Actualizado: {formatDate(videos.lastUpdated)} · {videos.totalVideos} vídeos
                    </p>
                )}
            </div>

            {/* Guru Grid */}
            <div className={styles.grid}>
                {GURUS.map((guru) => {
                    const guruVideos = videos?.gurus[guru.id] || [];
                    const isSelected = selectedGuru === guru.id;
                    const doctrines = getGuruDoctrines(guru);

                    return (
                        <div key={guru.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <img
                                    src={guru.photo}
                                    alt={guru.name}
                                    className={styles.photo}
                                />
                                <div className={styles.info}>
                                    <h2 className={styles.name}>{guru.name}</h2>
                                    <p className={styles.role}>{guru.title}</p>
                                    <p className={styles.company}>{guru.company}</p>
                                </div>
                            </div>

                            <p className={styles.bio}>{guru.bio}</p>

                            {/* Doctrines */}
                            {doctrines.length > 0 && (
                                <div className={styles.doctrines}>
                                    {doctrines.map(d => d && (
                                        <Link
                                            key={d.id}
                                            href={`/mejores-practicas/doctrinas#${d.id}`}
                                            className={styles.doctrineTag}
                                        >
                                            {d.icon} {d.shortTitle}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Videos Toggle */}
                            {guruVideos.length > 0 && (
                                <>
                                    <button
                                        className={styles.videosToggle}
                                        onClick={() => setSelectedGuru(isSelected ? null : guru.id)}
                                    >
                                        🎬 {guruVideos.length} vídeos recientes
                                        <span className={isSelected ? styles.arrowUp : styles.arrowDown}>▼</span>
                                    </button>

                                    {isSelected && (
                                        <div className={styles.videosList}>
                                            {guruVideos.map((video, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.videoItem}
                                                >
                                                    <img
                                                        src={video.thumbnail}
                                                        alt={video.title}
                                                        className={styles.videoThumb}
                                                    />
                                                    <div className={styles.videoInfo}>
                                                        <h4 className={styles.videoTitle}>{video.title}</h4>
                                                        <p className={styles.videoChannel}>{video.channelTitle}</p>
                                                        <p className={styles.videoDate}>{formatDate(video.publishedAt)}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {loading && <p className={styles.loading}>Cargando vídeos...</p>}
                        </div>
                    );
                })}
            </div>

            {/* Link to Doctrines */}
            <div className={styles.cta}>
                <Link href="/mejores-practicas/doctrinas" className={styles.ctaButton}>
                    Ver los 20 Principios de la Empresa AI-Nativa →
                </Link>
            </div>

            {/* Featured Podcast Section */}
            <FeaturedPodcast />
        </section>
    );
}

// Featured Podcast Component
function FeaturedPodcast() {
    const [podcast, setPodcast] = useState<{
        latestVideo: {
            videoId: string;
            title: string;
            description: string;
            publishedAt: string;
        };
        keyPoints: Array<{
            icon: string;
            title: string;
            description: string;
        }>;
    } | null>(null);

    useEffect(() => {
        const fetchPodcast = async () => {
            try {
                const res = await fetch('/data/featured-podcast.json');
                if (res.ok) {
                    const data = await res.json();
                    setPodcast(data);
                }
            } catch (err) {
                console.error('Could not load podcast:', err);
            }
        };
        fetchPodcast();
    }, []);

    if (!podcast) return null;

    return (
        <div className={styles.podcastSection}>
            <h2 className={styles.podcastTitle}>
                🎙️ No te lo pierdas
            </h2>
            <p className={styles.podcastSubtitle}>
                El podcast más reciente sobre IA, trabajo y empresa
            </p>

            <div className={styles.podcastContent}>
                {/* Video Embed */}
                <div className={styles.videoEmbed}>
                    <iframe
                        src={`https://www.youtube.com/embed/${podcast.latestVideo.videoId}`}
                        title={podcast.latestVideo.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.videoFrame}
                    />
                </div>

                {/* Key Points from Description */}
                {podcast.keyPoints && podcast.keyPoints.length > 0 && (
                    <div className={styles.insightsContainer}>
                        <h3 className={styles.insightsTitle}>
                            Puntos Clave del Podcast
                        </h3>
                        <div className={styles.insightsList}>
                            {podcast.keyPoints.map((point, idx) => (
                                <div key={idx} className={styles.insightItem}>
                                    <span className={styles.insightIcon}>{point.icon}</span>
                                    <div>
                                        <h4 className={styles.insightItemTitle}>{point.title}</h4>
                                        {point.description !== point.title && (
                                            <p className={styles.insightDescription}>{point.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
