import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationModal({ isOpen, onClose, title, message, type = 'success' }) {
    if (!isOpen) return null;

    const config = {
        success: {
            icon: CheckCircle,
            bg: 'bg-green-50',
            text: 'text-green-700',
            border: 'border-green-100',
            iconColor: 'text-green-600',
            button: 'bg-green-600 hover:bg-green-700'
        },
        error: {
            icon: XCircle,
            bg: 'bg-red-50',
            text: 'text-red-700',
            border: 'border-red-100',
            iconColor: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700'
        },
        info: {
            icon: Info,
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-100',
            iconColor: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const style = config[type] || config.info;
    const Icon = style.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                    <div className={`p-6 text-center ${style.bg}`}>
                        <div className={`mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm ${style.text}`}>
                            <Icon className={`w-8 h-8 ${style.iconColor}`} />
                        </div>
                        <h3 className={`text-xl font-bold ${style.text} mb-2`}>{title}</h3>
                        <p className="text-slate-600 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <div className="p-4 bg-white border-t border-slate-100">
                        <button
                            onClick={onClose}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-black/5 transition-transform active:scale-[0.98] ${style.button}`}
                        >
                            Okay, got it
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
