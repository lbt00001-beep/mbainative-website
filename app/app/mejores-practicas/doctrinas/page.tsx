import Link from 'next/link';
import { DOCTRINES } from '@/data/doctrines';
import { GURUS, getGuruById } from '@/data/gurus';
import styles from './doctrinas.module.css';

export default function DoctrinasPage() {
    return (
        <section className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/mejores-practicas" className={styles.backLink}>
                    ← Mejores Prácticas
                </Link>
                <h1 className={styles.title}>
                    10 <span className={styles.accent}>Doctrinas</span> de la IA
                </h1>
                <p className={styles.subtitle}>
                    Las tesis que definen el debate actual sobre Inteligencia Artificial.
                    Cada una con sus impulsores, defensores y objeciones.
                </p>
            </div>

            {/* Doctrines List */}
            <div className={styles.list}>
                {DOCTRINES.map((doctrine) => {
                    const proponents = doctrine.proponents
                        .map(id => getGuruById(id))
                        .filter(Boolean);

                    return (
                        <article
                            key={doctrine.id}
                            id={`${doctrine.id}`}
                            className={styles.card}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.icon}>{doctrine.icon}</span>
                                <div>
                                    <span className={styles.number}>#{doctrine.id}</span>
                                    <h2 className={styles.doctrineTitle}>{doctrine.title}</h2>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>📌 Tesis</h3>
                                <p className={styles.thesis}>{doctrine.thesis}</p>
                            </div>

                            {proponents.length > 0 && (
                                <div className={styles.section}>
                                    <h3 className={styles.sectionTitle}>👤 Impulsores</h3>
                                    <div className={styles.proponents}>
                                        {proponents.map(guru => guru && (
                                            <Link
                                                key={guru.id}
                                                href={`/mejores-practicas/gurus#${guru.id}`}
                                                className={styles.proponentTag}
                                            >
                                                <img
                                                    src={guru.photo}
                                                    alt={guru.name}
                                                    className={styles.proponentPhoto}
                                                />
                                                <span>{guru.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>⚠️ Objeción</h3>
                                <p className={styles.objection}>{doctrine.objection}</p>
                            </div>

                            {doctrine.sources.length > 0 && (
                                <div className={styles.sources}>
                                    {doctrine.sources.map((source, idx) => (
                                        <a
                                            key={idx}
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.sourceLink}
                                        >
                                            🔗 {source.title}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>

            {/* CTA */}
            <div className={styles.cta}>
                <Link href="/mejores-practicas/gurus" className={styles.ctaButton}>
                    Conoce a los 14 Gurús de la IA →
                </Link>
            </div>
        </section>
    );
}
