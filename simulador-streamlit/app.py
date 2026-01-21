"""
🎮 Simulador de Empresa AI-Nativa
MBAI Native - mbainative.com

Simula la gestión empresarial comparando:
- Empresa Tradicional (jerárquica, con fricción)  
- Empresa AI-Nativa (agentes IA, automatización)

Basado en datos financieros reales de Yahoo Finance.
"""

import streamlit as st
from engine.finance_engine import get_company_snapshot, translate_to_game_variables
from engine.game_engine import GameEngine
import plotly.graph_objects as go
import plotly.express as px

# Configuración de página
st.set_page_config(
    page_title="Simulador Empresa AI-Nativa | MBAI Native",
    page_icon="mbai-logo.png",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS personalizado para estilo MBAI Native
st.markdown("""
<style>
    /* Colores MBAI Native */
    :root {
        --accent: #00FFCC;
        --primary: #0D1117;
        --secondary: #161B22;
    }
    
    /* Header */
    .main-header {
        background: linear-gradient(135deg, #0D1117 0%, #161B22 100%);
        padding: 2rem;
        border-radius: 10px;
        margin-bottom: 2rem;
        border: 1px solid #30363D;
    }
    
    .main-header h1 {
        color: #00FFCC;
        margin-bottom: 0.5rem;
    }
    
    /* KPI Cards */
    .kpi-card {
        background: #161B22;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #30363D;
        text-align: center;
    }
    
    .kpi-value {
        font-size: 1.8rem;
        font-weight: bold;
        color: #00FFCC;
    }
    
    .kpi-label {
        color: #8B949E;
        font-size: 0.85rem;
    }
    
    /* Modo badges */
    .mode-traditional {
        background: #374151;
        color: #9CA3AF;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
    }
    
    .mode-ai-native {
        background: linear-gradient(135deg, #00FFCC 0%, #00D4AA 100%);
        color: #0D1117;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: bold;
    }
    
    /* Botones */
    .stButton > button {
        background: linear-gradient(135deg, #00FFCC 0%, #00D4AA 100%);
        color: #0D1117;
        font-weight: bold;
        border: none;
        border-radius: 8px;
    }
    
    .stButton > button:hover {
        background: linear-gradient(135deg, #00D4AA 0%, #00FFCC 100%);
    }
    
    /* Sidebar */
    .sidebar .sidebar-content {
        background: #0D1117;
    }
    
    /* Eventos */
    .event-card {
        background: #1F2937;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 0.5rem;
        border-left: 3px solid #00FFCC;
    }
    
    .event-crisis {
        border-left-color: #EF4444;
    }
</style>
""", unsafe_allow_html=True)


def init_session_state():
    """Inicializa variables de sesión"""
    if "game" not in st.session_state:
        st.session_state.game = None
    if "snapshot" not in st.session_state:
        st.session_state.snapshot = None
    if "selected_role" not in st.session_state:
        st.session_state.selected_role = "CEO"


def render_setup():
    """Página de configuración del juego"""
    col_logo, col_title = st.columns([1, 4])
    with col_logo:
        st.image("mbai-logo.png", width=120)
    with col_title:
        st.markdown("""
        <div class="main-header" style="padding: 1rem 2rem;">
            <h1 style="margin:0;">Simulador de Empresa AI-Nativa</h1>
            <p style="margin:0; opacity: 0.7;">MBAI Native - Gestión estratégica de nueva generación</p>
        </div>
        """, unsafe_allow_html=True)
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("📊 Configuración del Juego")
        
        ticker = st.text_input(
            "Ticker de la empresa",
            value="TSLA",
            placeholder="Ej: AAPL, MSFT, GOOGL, AMZN",
            help="Símbolo de cotización de la empresa"
        )
        
        industry = st.selectbox(
            "Tipo de industria",
            ["tech", "retail", "finance", "healthcare", "manufacturing"],
            format_func=lambda x: {
                "tech": "🖥️ Tecnología",
                "retail": "🛒 Retail",
                "finance": "💰 Finanzas",
                "healthcare": "🏥 Salud",
                "manufacturing": "🏭 Manufactura"
            }[x]
        )
        
        game_mode = st.radio(
            "Modo de juego",
            ["traditional", "ai_native"],
            format_func=lambda x: "🏢 Empresa Tradicional" if x == "traditional" else "🤖 Empresa AI-Nativa",
            horizontal=True,
            help="Tradicional: jerarquía, fricción, latencia. AI-Nativa: agentes IA, automatización, agilidad."
        )
        
        if st.button("🚀 Iniciar Simulación", use_container_width=True):
            with st.spinner(f"Descargando datos de {ticker}..."):
                snapshot = get_company_snapshot(ticker.upper())
                
                if snapshot:
                    st.session_state.snapshot = snapshot
                    st.session_state.game = GameEngine(
                        ticker=ticker.upper(),
                        company_name=snapshot["company_name"],
                        snapshot_data=snapshot,
                        industry_type=industry,
                        game_mode=game_mode
                    )
                    st.success(f"✅ {snapshot['company_name']} cargada correctamente")
                    st.rerun()
                else:
                    st.error(f"❌ No se encontraron datos para {ticker}")
    
    with col2:
        st.subheader("ℹ️ Información")
        
        st.info("""
        **¿Cómo funciona?**
        
        1. Elige una empresa real
        2. Selecciona el modo de gestión
        3. Toma decisiones como directivo
        4. Observa cómo evolucionan los KPIs
        
        **Modos disponibles:**
        
        🏢 **Tradicional**: Decisiones lentas, fricción organizacional, reportes manuales.
        
        🤖 **AI-Nativa**: Agentes IA, automatización, decisiones en tiempo real.
        """)


def render_dashboard():
    """Dashboard principal del juego"""
    game = st.session_state.game
    state = game.get_state()
    
    # Header con info de la empresa
    col1, col2, col3, col4 = st.columns([3, 1, 1, 1])
    
    with col1:
        mode_class = "mode-ai-native" if state["game_mode"] == "ai_native" else "mode-traditional"
        mode_text = "🤖 AI-Nativa" if state["game_mode"] == "ai_native" else "🏢 Tradicional"
        st.markdown(f"""
        <h2>{state['company_name']} ({state['ticker']})</h2>
        <span class="{mode_class}">{mode_text}</span>
        """, unsafe_allow_html=True)
    
    with col2:
        st.metric("Turno", f"{state['turn']} / {state['max_turns']}")
    
    with col3:
        st.metric("Industria", state['industry'].title())
    
    with col4:
        if st.button("🔄 Nuevo Juego"):
            st.session_state.game = None
            st.session_state.snapshot = None
            st.rerun()
    
    st.divider()
    
    # KPIs principales
    st.subheader("📊 KPIs Principales")
    
    kpis = state["kpis"]
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric(
            "💰 Caja",
            f"${kpis['cash']:,.0f}",
            delta=None
        )
    
    with col2:
        st.metric(
            "📈 Ingresos",
            f"${kpis['revenue']:,.0f}",
            delta=None
        )
    
    with col3:
        st.metric(
            "⚙️ Eficiencia",
            f"{kpis['efficiency']:.0f}%"
        )
    
    with col4:
        st.metric(
            "👥 Empleados",
            f"{kpis['employees']:,.0f}"
        )
    
    with col5:
        st.metric(
            "😊 Satisfacción",
            f"{kpis['satisfaction']:.0f}%"
        )
    
    # Segunda fila de KPIs
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric("📊 Margen", f"{kpis['profit_margin']:.1f}%")
    
    with col2:
        st.metric("🏆 Cuota Mercado", f"{kpis['market_share']:.1f}%")
    
    with col3:
        st.metric("⭐ Reputación", f"{kpis['brand_reputation']:.0f}")
    
    with col4:
        st.metric("📦 Capacidad", f"{kpis['production_capacity']:.0f}%")
    
    with col5:
        if state["game_mode"] == "ai_native":
            st.metric("🤖 Agentes IA", f"{kpis['ai_agents']:.0f}")
        else:
            st.metric("📉 Rotación", f"{kpis['turnover_rate']:.0f}%")
    
    st.divider()
    
    # Panel de acciones y eventos
    col_actions, col_events = st.columns([2, 1])
    
    with col_actions:
        render_action_panel(game, state)
    
    with col_events:
        render_events_panel(state)
    
    # Botón avanzar turno
    st.divider()
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if state["turn"] < state["max_turns"]:
            if st.button("⏩ Avanzar al Siguiente Turno", use_container_width=True):
                result = game.advance_turn()
                if result.get("game_over"):
                    st.balloons()
                    st.success("🎉 ¡Juego completado! Revisa el resumen.")
                st.rerun()
        else:
            st.success("🎉 ¡Simulación completada!")
            render_summary(game)


def render_action_panel(game, state):
    """Panel de acciones por rol"""
    st.subheader("🎯 Panel de Decisiones")
    
    roles = ["CEO", "CFO", "CMO", "COO", "CHRO", "CAIO"]
    
    selected_role = st.selectbox("Selecciona un rol", roles)
    
    # Acciones por rol
    actions = {
        "CEO": {
            "strategic_pivot": "🎯 Pivote Estratégico",
            "cost_cutting": "✂️ Reducción de Costes"
        },
        "CFO": {
            "raise_capital": "💰 Levantar Capital",
            "reduce_costs": "💵 Reducir Gastos",
            "invest_rd": "🔬 Invertir en I+D"
        },
        "CMO": {
            "marketing_campaign": "📣 Campaña Marketing",
            "customer_loyalty": "❤️ Programa Fidelización"
        },
        "COO": {
            "optimize_operations": "⚙️ Optimizar Operaciones",
            "expand_capacity": "🏭 Expandir Capacidad"
        },
        "CHRO": {
            "hire_talent": "👥 Contratar Talento",
            "training_program": "🎓 Programa Formación",
            "improve_culture": "🌟 Mejorar Cultura"
        },
        "CAIO": {
            "deploy_agents": "🤖 Desplegar Agentes IA",
            "train_models": "🧠 Entrenar Modelos",
            "automate_tasks": "⚡ Automatizar Tareas"
        }
    }
    
    role_actions = actions.get(selected_role, {})
    
    selected_action = st.selectbox(
        "Selecciona una acción",
        options=list(role_actions.keys()),
        format_func=lambda x: role_actions[x]
    )
    
    intensity = st.slider("Intensidad de la acción", 25, 100, 50, 5)
    
    if st.button("▶️ Ejecutar Acción", use_container_width=True):
        result = game.execute_action(selected_role, selected_action, intensity)
        st.success(result)
        st.rerun()


def render_events_panel(state):
    """Panel de eventos"""
    st.subheader("📋 Últimos Eventos")
    
    if state.get("last_action"):
        action = state["last_action"]
        st.markdown(f"""
        <div class="event-card">
            <strong>{action['role']}</strong>: {action['message']}
        </div>
        """, unsafe_allow_html=True)
    
    for event in reversed(state.get("events", [])[-5:]):
        event_class = "event-crisis" if event.get("type") == "crisis" else ""
        st.markdown(f"""
        <div class="event-card {event_class}">
            <small>Turno {event['turn']}</small><br>
            {event['event']}
        </div>
        """, unsafe_allow_html=True)
    
    if not state.get("events") and not state.get("last_action"):
        st.info("No hay eventos aún. ¡Toma decisiones!")


def render_summary(game):
    """Resumen final del juego"""
    st.subheader("📊 Resumen de la Partida")
    
    history = game.history
    state = game.get_state()
    
    # Gráfico de evolución
    if len(history) > 1:
        turns = list(range(1, len(history) + 1))
        
        fig = go.Figure()
        
        # Cash
        fig.add_trace(go.Scatter(
            x=turns,
            y=[h["cash"] for h in history],
            name="Caja",
            line=dict(color="#00FFCC", width=2)
        ))
        
        fig.update_layout(
            title="Evolución de Caja",
            xaxis_title="Turno",
            yaxis_title="$",
            template="plotly_dark",
            paper_bgcolor="#0D1117",
            plot_bgcolor="#161B22"
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    # KPIs finales
    st.info(f"""
    **Modo**: {"🤖 AI-Nativa" if state['game_mode'] == 'ai_native' else '🏢 Tradicional'}  
    **Turnos completados**: {state['turn']}  
    **Caja final**: ${state['kpis']['cash']:,.0f}  
    **Eficiencia final**: {state['kpis']['efficiency']:.0f}%  
    **Empleados**: {state['kpis']['employees']:,.0f}
    """)


def main():
    """Función principal"""
    init_session_state()
    
    # Sidebar
    with st.sidebar:
        st.image("https://mbainative.com/images/logo-mbainative.png", width=200)
        st.markdown("---")
        st.markdown("### 🎮 Simulador MBAI")
        st.markdown("""
        Experimenta la gestión empresarial en la era de la IA.
        
        **Comparación:**
        - Empresa Tradicional
        - Empresa AI-Nativa
        
        [🌐 mbainative.com](https://mbainative.com)
        """)
    
    # Contenido principal
    if st.session_state.game is None:
        render_setup()
    else:
        render_dashboard()


if __name__ == "__main__":
    main()
