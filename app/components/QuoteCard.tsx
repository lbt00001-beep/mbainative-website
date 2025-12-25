"use client";

interface QuoteCardProps {
    quote: string;
    author: string;
    title: string;
    company: string;
    imageUrl?: string;
    sourceUrl?: string;
    videoUrl?: string;
}

export default function QuoteCard({
    quote,
    author,
    title,
    company,
    imageUrl,
    sourceUrl,
    videoUrl,
}: QuoteCardProps) {
    return (
        <div className="bg-[--dark-gray] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[--accent]">
            <div className="flex items-start gap-4">
                {imageUrl && (
                    <div className="flex-shrink-0">
                        <img
                            src={imageUrl}
                            alt={author}
                            className="w-16 h-16 rounded-full object-cover border-2 border-[--accent]"
                        />
                    </div>
                )}
                <div className="flex-1">
                    <blockquote className="text-lg italic text-gray-200 mb-4">
                        "{quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-[--accent]">{author}</p>
                            <p className="text-sm text-gray-400">
                                {title}, {company}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {sourceUrl && (
                                <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[--accent] hover:underline"
                                >
                                    📰 Fuente
                                </a>
                            )}
                            {videoUrl && (
                                <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[--accent] hover:underline"
                                >
                                    🎥 Video
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
