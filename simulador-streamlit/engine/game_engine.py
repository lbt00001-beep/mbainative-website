"""
Motor del juego - Versión Streamlit
Gestiona el estado y la lógica del simulador
"""

from typing import Dict, List, Optional
from datetime import datetime
import random


class GameEngine:
    """
    Motor principal del juego.
    Soporta dos modos: Traditional y AI Native
    """
    
    def __init__(self, ticker: str, company_name: str, snapshot_data: Dict,
                 industry_type: str = "tech", game_mode: str = "traditional"):
        
        self.ticker = ticker
        self.company_name = company_name
        self.industry_type = industry_type
        self.game_mode = game_mode  # "traditional" or "ai_native"
        self.snapshot = snapshot_data
        
        # Estado del juego
        self.current_turn = 1
        self.max_turns = 12  # 12 turnos = 1 año
        self.created_at = datetime.now()
        
        # Inicializar KPIs
        self.kpis = self._initialize_kpis()
        
        # Historial para gráficos
        self.history = [self.kpis.copy()]
        
        # Eventos y mensajes
        self.events = []
        self.last_action = None
        
        # Trabajadores de silicio (solo IA nativa)
        self.silicon_workers = 0 if game_mode == "traditional" else 5
        
    def _initialize_kpis(self) -> Dict:
        """Inicializa KPIs basados en el snapshot real"""
        top_10 = self.snapshot.get("top_10", {})
        deep = self.snapshot.get("deep_data", {})
        
        # Normalizar valores
        cash = deep.get("cash", 1000000) or 1000000
        revenue = deep.get("total_revenue", 100000000) or 100000000
        employees = deep.get("full_time_employees", 100) or 100
        
        return {
            # Financieros
            "cash": cash,
            "revenue": revenue,
            "ebitda": deep.get("ebitda", revenue * 0.15) or revenue * 0.15,
            "profit_margin": (deep.get("profit_margins", 0.1) or 0.1) * 100,
            "debt": deep.get("total_debt", cash * 0.5) or cash * 0.5,
            
            # Operaciones
            "efficiency": 70 + random.randint(-10, 10),
            "quality_score": 80 + random.randint(-5, 5),
            "production_capacity": 75 + random.randint(-10, 10),
            
            # Recursos Humanos
            "employees": employees,
            "satisfaction": 70 + random.randint(-10, 10),
            "productivity": 75 + random.randint(-5, 5),
            "turnover_rate": 15 + random.randint(-5, 5),
            
            # Marketing
            "brand_reputation": 70 + random.randint(-10, 10),
            "market_share": 20 + random.randint(-5, 5),
            "customer_satisfaction": 75 + random.randint(-5, 5),
            
            # IA (solo modo ai_native)
            "ai_agents": 5 if self.game_mode == "ai_native" else 0,
            "automation_level": 30 if self.game_mode == "ai_native" else 0,
            "compute_cost": 50000 if self.game_mode == "ai_native" else 0,
        }
    
    def get_state(self) -> Dict:
        """Retorna el estado completo del juego"""
        return {
            "ticker": self.ticker,
            "company_name": self.company_name,
            "game_mode": self.game_mode,
            "industry": self.industry_type,
            "turn": self.current_turn,
            "max_turns": self.max_turns,
            "kpis": self.kpis,
            "events": self.events[-5:],  # Últimos 5 eventos
            "last_action": self.last_action,
        }
    
    def execute_action(self, role: str, action_type: str, intensity: int = 50) -> str:
        """
        Ejecuta una acción de un rol específico.
        Retorna mensaje de resultado.
        """
        # Factor de intensidad (0.5 a 1.5)
        factor = 0.5 + (intensity / 100)
        
        # Fricción en modo tradicional
        friction = 0.7 if self.game_mode == "traditional" else 1.0
        
        message = ""
        
        if role == "CEO":
            message = self._execute_ceo_action(action_type, factor, friction)
        elif role == "CFO":
            message = self._execute_cfo_action(action_type, factor, friction)
        elif role == "CMO":
            message = self._execute_cmo_action(action_type, factor, friction)
        elif role == "COO":
            message = self._execute_coo_action(action_type, factor, friction)
        elif role == "CHRO":
            message = self._execute_chro_action(action_type, factor, friction)
        elif role == "CAIO":
            message = self._execute_caio_action(action_type, factor)
        
        self.last_action = {"role": role, "action": action_type, "message": message}
        return message
    
    def _execute_ceo_action(self, action: str, factor: float, friction: float) -> str:
        if action == "strategic_pivot":
            self.kpis["brand_reputation"] += int(8 * factor * friction)
            self.kpis["market_share"] += int(3 * factor * friction)
            return "🎯 Pivote estratégico iniciado"
        elif action == "cost_cutting":
            self.kpis["cash"] += int(self.kpis["revenue"] * 0.05 * factor)
            self.kpis["satisfaction"] -= int(5 * factor)
            return "✂️ Plan de reducción de costes implementado"
        return "Acción CEO ejecutada"
    
    def _execute_cfo_action(self, action: str, factor: float, friction: float) -> str:
        if action == "raise_capital":
            amount = int(self.kpis["cash"] * 0.3 * factor * friction)
            self.kpis["cash"] += amount
            self.kpis["debt"] += int(amount * 0.8)
            return f"💰 Capital levantado: ${amount:,.0f}"
        elif action == "reduce_costs":
            saved = int(self.kpis["revenue"] * 0.03 * factor * friction)
            self.kpis["cash"] += saved
            return f"💵 Costes reducidos: ${saved:,.0f}"
        elif action == "invest_rd":
            invested = int(self.kpis["cash"] * 0.1 * factor)
            self.kpis["cash"] -= invested
            self.kpis["efficiency"] += int(5 * factor * friction)
            return f"🔬 Inversión en I+D: ${invested:,.0f}"
        return "Acción CFO ejecutada"
    
    def _execute_cmo_action(self, action: str, factor: float, friction: float) -> str:
        if action == "marketing_campaign":
            cost = int(self.kpis["revenue"] * 0.02 * factor)
            self.kpis["cash"] -= cost
            self.kpis["brand_reputation"] += int(8 * factor * friction)
            self.kpis["market_share"] += int(2 * factor * friction)
            return f"📣 Campaña lanzada (${cost:,.0f})"
        elif action == "customer_loyalty":
            self.kpis["customer_satisfaction"] += int(10 * factor * friction)
            return "❤️ Programa de fidelización activado"
        return "Acción CMO ejecutada"
    
    def _execute_coo_action(self, action: str, factor: float, friction: float) -> str:
        if action == "optimize_operations":
            self.kpis["efficiency"] += int(10 * factor * friction)
            self.kpis["quality_score"] += int(5 * factor * friction)
            return "⚙️ Operaciones optimizadas"
        elif action == "expand_capacity":
            cost = int(self.kpis["cash"] * 0.15 * factor)
            self.kpis["cash"] -= cost
            self.kpis["production_capacity"] += int(15 * factor * friction)
            return f"🏭 Capacidad expandida (${cost:,.0f})"
        return "Acción COO ejecutada"
    
    def _execute_chro_action(self, action: str, factor: float, friction: float) -> str:
        if action == "hire_talent":
            new_hires = int(10 * factor)
            cost = new_hires * 75000
            self.kpis["cash"] -= cost
            self.kpis["employees"] += new_hires
            self.kpis["productivity"] += int(3 * factor * friction)
            return f"👥 {new_hires} empleados contratados"
        elif action == "training_program":
            self.kpis["productivity"] += int(8 * factor * friction)
            self.kpis["satisfaction"] += int(5 * factor * friction)
            return "🎓 Programa de formación lanzado"
        elif action == "improve_culture":
            self.kpis["satisfaction"] += int(12 * factor * friction)
            self.kpis["turnover_rate"] -= int(3 * factor * friction)
            return "🌟 Cultura empresarial mejorada"
        return "Acción CHRO ejecutada"
    
    def _execute_caio_action(self, action: str, factor: float) -> str:
        # Acción CAIO funcional en ambos modos para soportar 6 jugadores
        
        if action == "deploy_agents":
            new_agents = int(5 * factor)
            cost = new_agents * 10000
            self.kpis["cash"] -= cost
            self.kpis["ai_agents"] += new_agents
            self.kpis["automation_level"] += int(5 * factor)
            self.kpis["efficiency"] += int(8 * factor)
            return f"🤖 {new_agents} agentes IA desplegados"
        elif action == "train_models":
            cost = int(50000 * factor)
            self.kpis["cash"] -= cost
            self.kpis["compute_cost"] += cost
            self.kpis["automation_level"] += int(10 * factor)
            self.kpis["productivity"] += int(5 * factor)
            return "🧠 Modelos de IA entrenados"
        elif action == "automate_tasks":
            self.kpis["efficiency"] += int(15 * factor)
            self.kpis["employees"] -= int(5 * factor)  # Automatización reemplaza empleados
            return "⚡ Tareas automatizadas"
        return "Acción CAIO ejecutada"
    
    def advance_turn(self) -> Dict:
        """Avanza al siguiente turno y aplica evolución natural"""
        if self.current_turn >= self.max_turns:
            return {"message": "Juego terminado", "game_over": True}
        
        # Evolución natural de KPIs
        self._natural_evolution()
        
        # Posible evento de crisis
        if random.random() < 0.15:  # 15% probabilidad
            self._generate_crisis()
        
        self.current_turn += 1
        
        # Guardar en historial
        self.history.append(self.kpis.copy())
        
        return {
            "message": f"Turno {self.current_turn} iniciado",
            "game_over": False,
            "turn": self.current_turn
        }
    
    def _natural_evolution(self):
        """Evolución natural de KPIs por turno"""
        # Modo IA nativa tiene mejor evolución
        bonus = 1.2 if self.game_mode == "ai_native" else 1.0
        
        # Ingresos crecen ligeramente
        growth = random.uniform(0.005, 0.025) * bonus
        self.kpis["revenue"] *= (1 + growth)
        
        # Cash flow básico
        profit = self.kpis["revenue"] * (self.kpis["profit_margin"] / 100) * 0.08
        self.kpis["cash"] += int(profit)
        
        # Satisfacción puede decrecer con el tiempo
        self.kpis["satisfaction"] -= random.randint(0, 3)
        self.kpis["satisfaction"] = max(20, min(100, self.kpis["satisfaction"]))
    
    def _generate_crisis(self):
        """Genera un evento de crisis aleatorio"""
        crises = [
            {
                "name": "Crisis de suministro",
                "icon": "📦",
                "impact": {"efficiency": -15, "production_capacity": -10}
            },
            {
                "name": "Fuga de talento",
                "icon": "🚪",
                "impact": {"employees": -5, "productivity": -10, "satisfaction": -8}
            },
            {
                "name": "Problema de calidad",
                "icon": "⚠️",
                "impact": {"quality_score": -20, "brand_reputation": -10}
            },
            {
                "name": "Competidor agresivo",
                "icon": "🎯",
                "impact": {"market_share": -5, "revenue": -self.kpis["revenue"] * 0.03}
            }
        ]
        
        crisis = random.choice(crises)
        
        # Aplicar impactos
        for kpi, impact in crisis["impact"].items():
            if kpi in self.kpis:
                self.kpis[kpi] += int(impact)
        
        event = f"{crisis['icon']} {crisis['name']}"
        self.events.append({"turn": self.current_turn, "event": event, "type": "crisis"})
