"""
Motor de datos financieros - Adaptado para Streamlit
Descarga datos reales de empresas usando Yahoo Finance
"""

import yfinance as yf
import pandas as pd
from typing import Dict, Optional
from datetime import datetime
import streamlit as st


@st.cache_data(ttl=3600)  # Cache por 1 hora
def get_company_snapshot(ticker: str) -> Optional[Dict]:
    """
    Descarga ~50 KPIs financieros de una empresa real.
    
    Args:
        ticker: Símbolo de la empresa (ej: "TSLA", "AAPL", "MSFT")
        
    Returns:
        Diccionario con datos financieros o None si no se encuentra
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        if not info or 'currentPrice' not in info:
            return None
        
        # Top 10 KPIs principales
        top_10_kpis = {
            "precio_actual": info.get("currentPrice", 0),
            "per": info.get("trailingPE", 0),
            "market_cap": info.get("marketCap", 0),
            "beta": info.get("beta", 1.0),
            "eps": info.get("trailingEps", 0),
            "dividend_yield": info.get("dividendYield", 0) or 0,
            "volumen": info.get("volume", 0),
            "high_52w": info.get("fiftyTwoWeekHigh", 0),
            "low_52w": info.get("fiftyTwoWeekLow", 0),
            "roe": info.get("returnOnEquity", 0) or 0
        }
        
        # KPIs adicionales
        deep_kpis = {
            # Valoración
            "pb_ratio": info.get("priceToBook", 0),
            "ps_ratio": info.get("priceToSalesTrailing12Months", 0),
            "peg_ratio": info.get("pegRatio", 0),
            "enterprise_value": info.get("enterpriseValue", 0),
            
            # Rentabilidad
            "gross_margins": info.get("grossMargins", 0) or 0,
            "operating_margins": info.get("operatingMargins", 0) or 0,
            "profit_margins": info.get("profitMargins", 0) or 0,
            "roa": info.get("returnOnAssets", 0) or 0,
            
            # Liquidez
            "current_ratio": info.get("currentRatio", 0) or 0,
            "quick_ratio": info.get("quickRatio", 0) or 0,
            "cash": info.get("totalCash", 0),
            
            # Deuda
            "total_debt": info.get("totalDebt", 0),
            "debt_to_equity": info.get("debtToEquity", 0) or 0,
            
            # Flujo de caja
            "free_cash_flow": info.get("freeCashflow", 0),
            "operating_cash_flow": info.get("operatingCashflow", 0),
            
            # Ingresos
            "total_revenue": info.get("totalRevenue", 0),
            "ebitda": info.get("ebitda", 0),
            
            # Empleados
            "full_time_employees": info.get("fullTimeEmployees", 0),
            
            # Info
            "sector": info.get("sector", "Unknown"),
            "industry": info.get("industry", "Unknown"),
            "country": info.get("country", "Unknown"),
            "business_summary": (info.get("longBusinessSummary", "") or "")[:300],
        }
        
        # Calcular revenue por empleado
        employees = deep_kpis["full_time_employees"]
        revenue = deep_kpis["total_revenue"]
        deep_kpis["revenue_per_employee"] = revenue / employees if employees > 0 else 0
        
        return {
            "ticker": ticker.upper(),
            "timestamp": datetime.now().isoformat(),
            "company_name": info.get("longName", ticker),
            "top_10": top_10_kpis,
            "deep_data": deep_kpis,
        }
        
    except Exception as e:
        st.error(f"Error descargando datos para {ticker}: {str(e)}")
        return None


def translate_to_game_variables(snapshot: Dict) -> Dict:
    """
    Traduce datos financieros a variables iniciales del juego.
    """
    top_10 = snapshot["top_10"]
    deep = snapshot["deep_data"]
    
    beta = top_10.get("beta", 1.0) or 1.0
    current_ratio = deep.get("current_ratio", 1.0) or 1.0
    debt_to_equity = deep.get("debt_to_equity", 0) or 0
    operating_margins = deep.get("operating_margins", 0) or 0
    roa = deep.get("roa", 0) or 0
    dividend_yield = top_10.get("dividend_yield", 0) or 0
    market_cap = top_10.get("market_cap", 0) or 0
    
    return {
        "market_volatility": "high" if beta > 1.5 else "medium" if beta > 1.0 else "low",
        "financial_health": "strong" if current_ratio > 2.0 else "moderate" if current_ratio > 1.0 else "weak",
        "debt_pressure": "high" if debt_to_equity > 2.0 else "medium" if debt_to_equity > 1.0 else "low",
        "profitability": "high" if operating_margins > 0.20 else "medium" if operating_margins > 0.10 else "low",
        "company_size": _determine_company_size(market_cap),
        "operational_efficiency": "high" if roa > 0.10 else "medium" if roa > 0.05 else "low",
        "maturity_stage": "mature" if dividend_yield > 0.02 else "growth",
        "workforce_size": deep.get("full_time_employees", 100),
        "revenue_per_employee": deep.get("revenue_per_employee", 0),
        "initial_cash": deep.get("cash", 1000000),
        "crisis_probability": _calculate_crisis_probability(snapshot)
    }


def _determine_company_size(market_cap: float) -> str:
    if market_cap > 200_000_000_000:
        return "mega_cap"
    elif market_cap > 10_000_000_000:
        return "large_cap"
    elif market_cap > 2_000_000_000:
        return "mid_cap"
    return "small_cap"


def _calculate_crisis_probability(snapshot: Dict) -> float:
    top_10 = snapshot["top_10"]
    deep = snapshot["deep_data"]
    
    score = 0.0
    if (top_10.get("beta", 1.0) or 1.0) > 1.5:
        score += 0.2
    if (deep.get("debt_to_equity", 0) or 0) > 2.0:
        score += 0.2
    if (deep.get("current_ratio", 1.0) or 1.0) < 1.0:
        score += 0.3
    if (deep.get("operating_margins", 0) or 0) < 0:
        score += 0.3
    
    return min(score, 1.0)
