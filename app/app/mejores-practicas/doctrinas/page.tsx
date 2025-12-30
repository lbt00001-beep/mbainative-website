import Link from 'next/link';
import { DOCTRINES, DOCTRINE_CATEGORIES, getDoctrinesByCategory } from '@/data/doctrines';
import { getGuruById } from '@/data/gurus';
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
                    20 <span className={styles.accent}>Principios</span> de la Empresa AI-Nativa
                </h1>
                <p className={styles.subtitle}>
                    Los principios que definen cómo organizar, dirigir y escalar empresas
                    en la era de los agentes de IA. De la organización por tareas al compliance automatizado.
                </p>
            </div>

            {/* Category Navigation */}
            <div className={styles.categoryNav}>
                {DOCTRINE_CATEGORIES.map(cat => (
                    <a key={cat.id} href={`#${cat.id}`} className={styles.categoryLink}>
                        <span className={styles.categoryIcon}>{cat.icon}</span>
                        <span>{cat.name}</span>
                    </a>
                ))}
            </div>

            {/* Doctrines by Category */}
            {DOCTRINE_CATEGORIES.map(category => {
                const doctrines = getDoctrinesByCategory(category.id);
                return (
                    <div key={category.id} id={category.id} className={styles.categorySection}>
                        <div className={styles.categoryHeader}>
                            <span className={styles.categoryHeaderIcon}>{category.icon}</span>
                            <div>
                                <h2 className={styles.categoryTitle}>{category.name}</h2>
                                <p className={styles.categoryDescription}>{category.description}</p>
                            </div>
                        </div>

                        <div className={styles.list}>
                            {doctrines.map((doctrine) => {
                                const proponents = doctrine.proponents
                                    .map(id => getGuruById(id))
                                    .filter(Boolean);

                                return (
                                    <article
                                        key={doctrine.id}
                                        id={`doctrine-${doctrine.id}`}
                                        className={styles.card}
                                    >
                                        <div className={styles.cardHeader}>
                                            <span className={styles.icon}>{doctrine.icon}</span>
                                            <div>
                                                <span className={styles.number}>#{String(doctrine.id).padStart(2, '0')}</span>
                                                <h2 className={styles.doctrineTitle}>{doctrine.title}</h2>
                                                <span className={styles.shortTitle}>{doctrine.shortTitle}</span>
                                            </div>
                                        </div>

                                        <div className={styles.section}>
                                            <h3 className={styles.sectionTitle}>📌 Tesis</h3>
                                            <p className={styles.thesis}>{doctrine.thesis}</p>
                                        </div>

                                        <div className={styles.section}>
                                            <h3 className={styles.sectionTitle}>💡 Implicaciones</h3>
                                            <p className={styles.implications}>{doctrine.implications}</p>
                                        </div>

                                        <div className={styles.section}>
                                            <h3 className={styles.sectionTitle}>⚠️ Retos</h3>
                                            <p className={styles.challenges}>{doctrine.challenges}</p>
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
                    </div>
                );
            })}

            {/* CTA */}
            <div className={styles.cta}>
                <Link href="/mejores-practicas/gurus" className={styles.ctaButton}>
                    Conoce a los Líderes que impulsan estas ideas →
                </Link>
            </div>
        </section>
    );
}
