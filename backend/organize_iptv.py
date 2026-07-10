"""
Organiza canais IPTV do Xtream em categorias hierárquicas
"""
import sqlite3, os

DB_PATH = r"D:\iptvlumora\backend\lumora.db"

# Mapeamento de grupos para categorias
CATEGORY_MAP = {
    # Filmes
    "Filmes": "Filmes",
    "24H FILMES": "Filmes",
    "FILMES E SÉRIES": "Filmes",
    
    # Séries
    "Séries": "Séries",
    "24H SÉRIES/PROGRAMAS": "Séries",
    "24H SÉRIES/PROGRAMAS +": "Séries",
    
    # Novelas
    "Novelas": "Novelas",
    "24H NOVELAS": "Novelas",
    
    # Esportes
    "Sports": "Esportes",
    "ESPORTES": "Esportes",
    "LUTAS / UFC": "Esportes",
    "PREMIERE": "Esportes",
    "ESPN": "Esportes",
    "SPORTV": "Esportes",
    "BAND": "Esportes",
    "NBA/NFL PPV": "Esportes",
    "HBO MAX PPV": "Esportes",
    "DAZN PPV": "Esportes",
    "GOAT PPV": "Esportes",
    "SPORTYNET PPV": "Esportes",
    "COPINHA 2026": "Esportes",
    "JOGOS DO DIA (21/06)": "Esportes",
    "JOGOS COPA 2026": "Esportes",
    "CAMPEONATOS ESTADUAIS": "Esportes",
    "PAY-PER-VIEW": "Esportes",
    "TELECINE": "Esportes",
    
    # Notícias
    "News": "Notícias",
    "NOTICIAS": "Notícias",
    "RÁDIOS NOTÍCIAS/JORNALISMO": "Notícias",
    
    # Infantil
    "Kids": "Infantil",
    "24H INFANTIS/DESENHOS": "Infantil",
    "INFANTIS": "Infantil",
    "Desenhos | Evangélicos": "Infantil",
    
    # Adultos
    "Filmes | XXX Adultos": "Adultos",
    "ADULTOS +18": "Adultos",
    "ADULTOS +18 - ONLY FANS/PRIVACY": "Adultos",
    "ADULTOS +18 STRIPCHAT AO VIVO": "Adultos",
    "ADULTOS +18 CAM4 AO VIVO": "Adultos",
    "ADULTOS +18 PREMIUM": "Adultos",
    "ADULTOS 18+ GAYS/TRANS": "Adultos",
    "ADULTOS +18 - XVIDEOS RED": "Adultos",
    "ADULTOS +18 TUFOS": "Adultos",
    
    # Religião
    "Religious": "Religiosos",
    "RELIGIOSOS": "Religiosos",
    "RÁDIOS RELIGIOSAS": "Religiosos",
    
    # Música
    "Music": "Música",
    "Especial | Karaokê": "Música",
    "Especial | Karaokê/Infantil": "Música",
    
    # Documentários
    "Documentary": "Documentários",
    "DOCUMENTÁRIOS": "Documentários",
    
    # Educação
    "Education": "Educação",
    
    # Variedades
    "Entertainment": "Variedades",
    "VARIEDADES": "Variedades",
    "Especial | Shows": "Variedades",
    "Reels | Shorts": "Variedades",
    
    # 24h Canais
    "24H ANIMAÇÃO/INFANTIL": "Canais 24H",
    "24H AÇÃO": "Canais 24H",
    "24H DRAMA": "Canais 24H",
    "24H FILMES LANÇAMENTOS": "Canais 24H",
    "24H HOMEM ARANHA": "Canais 24H",
    "24H X-MEN": "Canais 24H",
    "24H MARVEL": "Canais 24H",
    "24H DISCOVERY+": "Canais 24H",
    "24H DORAMAS": "Canais 24H",
    "24H DRAGON BALL": "Canais 24H",
    "24H NOSTALGIA TV CULTURA": "Canais 24H",
    
    # Canais Abertos
    "ABERTOS": "Canais Abertos",
    "GLOBO SUDESTE": "Canais Abertos",
    "GLOBO NORDESTE": "Canais Abertos",
    "GLOBO SUL": "Canais Abertos",
    "GLOBO NORTE": "Canais Abertos",
    "GLOBO CENTRO-OESTE": "Canais Abertos",
    "RECORD TV": "Canais Abertos",
    "SBT": "Canais Abertos",
    
    # Rádios
    "RÁDIOS DIVERSAS": "Rádios",
    
    # Culinária
    "Cooking": "Culinária",
    "CULINÁRIA": "RECEITAS",
    "RECEITAS": "Culinária",
}

def parse_category(group_name):
    """Parse group_name and return (category, subcategory)"""
    # Direct match
    if group_name in CATEGORY_MAP:
        return CATEGORY_MAP[group_name], ""
    
    # Parse "Tipo | Subtipo" format
    if " | " in group_name:
        parts = group_name.split(" | ", 1)
        main_type = parts[0].strip()
        sub_type = parts[1].strip()
        
        # Map main type
        type_map = {
            "Séries": "Séries",
            "Filmes": "Filmes",
            "Novelas": "Novelas",
        }
        
        if main_type in type_map:
            return type_map[main_type], sub_type
    
    # Check for keywords
    g = group_name.lower()
    if "adult" in g or "xxx" in g or "+18" in g or "stripchat" in g or "cam4" in g:
        return "Adultos", ""
    if "esporte" in g or "sport" in g or "ufc" in g or "luta" in g or "nba" in g or "nfl" in g or "futebol" in g or "premiere" in g or "espn" in g or "sportv" in g or "band" in g or "ppv" in g:
        return "Esportes", ""
    if "news" in g or "noticia" in g or "jornal" in g:
        return "Notícias", ""
    if "kid" in g or "infantil" in g or "desenho" in g or "cartoon" in g:
        return "Infantil", ""
    if "music" in g or "musical" in g or "karaokê" in g or "karaoke" in g:
        return "Música", ""
    if "documentary" in g or "documentário" in g or "documentario" in g:
        return "Documentários", ""
    if "religious" in g or "religioso" in g or "evangélico" in g or "evangelico" in g:
        return "Religiosos", ""
    if "education" in g or "educação" in g or "educacao" in g:
        return "Educação", ""
    if "novela" in g:
        return "Novelas", ""
    if "série" in g or "serie" in g:
        return "Séries", ""
    if "filme" in g:
        return "Filmes", ""
    if "24h" in g:
        return "Canais 24H", ""
    if "radio" in g or "rádio" in g:
        return "Rádios", ""
    if "cooking" in g or "culinária" in g or "culinaria" in g or "receita" in g:
        return "Culinária", ""
    if "lifestyle" in g or "travel" in g or "viagem" in g:
        return "Variedades", ""
    if "business" in g or "negócio" in g:
        return "Negócios", ""
    if "science" in g or "ciência" in g or "ciencia" in g:
        return "Ciência", ""
    if "auto" in g or "carro" in g or "moto" in g:
        return "Auto", ""
    if "shop" in g or "compra" in g:
        return "Compras", ""
    if "weather" in g or "clima" in g or "tempo" in g:
        return "Clima", ""
    if "legislative" in g or "legislativo" in g:
        return "Legislativo", ""
    if "classic" in g or "clássico" in g or "classico" in g:
        return "Clássicos", ""
    if "animation" in g or "animação" in g or "animacao" in g:
        return "Animação", ""
    if "comedy" in g or "comédia" in g or "comedia" in g:
        return "Comédia", ""
    if "drama" in g:
        return "Drama", ""
    if "terror" in g or "horror" in g:
        return "Terror", ""
    if "suspense" in g or "thriller" in g:
        return "Suspense", ""
    if "romance" in g or "romântico" in g:
        return "Romance", ""
    if "action" in g or "ação" in g or "acao" in g:
        return "Ação", ""
    if "adventure" in g or "aventura" in g:
        return "Aventura", ""
    if "fantasy" in g or "fantasia" in g or "ficção" in g or "ficcao" in g:
        return "Fantasia/Ficção", ""
    if "crime" in g or "policial" in g:
        return "Crime/Policial", ""
    if "war" in g or "guerra" in g:
        return "Guerra", ""
    if "history" in g or "história" in g or "historia" in g:
        return "História", ""
    if "mystery" in g or "mistério" in g or "misterio" in g:
        return "Mistério", ""
    if "family" in g or "família" in g or "familia" in g:
        return "Família", ""
    if "national" in g or "nacional" in g or "brasileiro" in g or "brasileira" in g:
        return "Nacionais", ""
    if "dubbing" in g or "dublagem" in g or "dublado" in g:
        return "Dublados", ""
    if "legendado" in g or "legendada" in g:
        return "Legendados", ""
    if "lançamento" in g or "lancamento" in g or "estreia" in g:
        return "Lançamentos", ""
    if "cinema" in g:
        return "Cinema", ""
    if "tv" in g or "canal" in g:
        return "Canais TV", ""
    
    return "Outros", group_name

def main():
    print("=" * 60)
    print("  Lumora IPTV - Organizador de Categorias")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create categories table
    print("\n[1/4] Criando tabela de categorias...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS iptv_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            icon TEXT DEFAULT '📺',
            parent_id INTEGER,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES iptv_categories(id)
        )
    """)
    
    # Add category_id column to iptv_channels if not exists
    try:
        c.execute("ALTER TABLE iptv_channels ADD COLUMN category_id INTEGER")
    except:
        pass  # Column already exists
    
    # Get all unique groups
    print("[2/4] Lendo grupos de canais...")
    c.execute("SELECT DISTINCT group_name FROM iptv_channels WHERE source='xtream'")
    groups = [row[0] for row in c.fetchall()]
    print(f"  Encontrados {len(groups)} grupos unicos")
    
    # Parse and create categories
    print("[3/4] Criando categorias...")
    categories = {}  # name -> id
    subcategories = {}  # (parent_name, sub_name) -> id
    
    for group_name in groups:
        cat_name, sub_name = parse_category(group_name)
        
        # Create main category if not exists
        if cat_name not in categories:
            slug = cat_name.lower().replace(" ", "-").replace("/", "-").replace("ç", "c").replace("ã", "a").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
            icon_map = {
                "Filmes": "🎬", "Séries": "📺", "Novelas": "🎭", "Esportes": "⚽",
                "Notícias": "📰", "Infantil": "🧸", "Adultos": "🔞", "Religiosos": "⛪",
                "Música": "🎵", "Documentários": "📹", "Educação": "📚", "Variedades": "🎪",
                "Canais 24H": "⏰", "Canais Abertos": "📡", "Rádios": "📻", "Culinária": "🍳",
                "Negócios": "💼", "Ciência": "🔬", "Auto": "🚗", "Compras": "🛒",
                "Clima": "🌤", "Legislativo": "🏛", "Clássicos": "🎞", "Animação": "🎨",
                "Comédia": "😂", "Drama": "🎭", "Terror": "👻", "Suspense": "😱",
                "Romance": "💕", "Ação": "💥", "Aventura": "🗺", "Fantasia/Ficção": "🧙",
                "Crime/Policial": "🔍", "Guerra": "⚔", "História": "📜", "Mistério": "🔎",
                "Família": "👨‍👩‍👧", "Nacionais": "🇧🇷", "Dublados": "🗣", "Legendados": "📝",
                "Lançamentos": "🆕", "Cinema": "🎥", "Canais TV": "📺", "Outros": "📦"
            }
            icon = icon_map.get(cat_name, "📺")
            
            try:
                c.execute("INSERT OR IGNORE INTO iptv_categories(name, slug, icon, sort_order) VALUES(?,?,?,?)",
                          (cat_name, slug, icon, len(categories)))
                categories[cat_name] = c.lastrowid
            except:
                c.execute("SELECT id FROM iptv_categories WHERE name=?", (cat_name,))
                categories[cat_name] = c.fetchone()[0]
        
        # Create subcategory if needed
        if sub_name:
            parent_id = categories[cat_name]
            sub_slug = sub_name.lower().replace(" ", "-").replace("/", "-").replace("ç", "c").replace("ã", "a")
            key = (cat_name, sub_name)
            
            if key not in subcategories:
                try:
                    c.execute("INSERT OR IGNORE INTO iptv_categories(name, slug, parent_id, sort_order) VALUES(?,?,?,?)",
                              (sub_name, sub_slug, parent_id, len(subcategories)))
                    subcategories[key] = c.lastrowid
                except:
                    c.execute("SELECT id FROM iptv_categories WHERE name=? AND parent_id=?", (sub_name, parent_id))
                    row = c.fetchone()
                    if row:
                        subcategories[key] = row[0]
    
    conn.commit()
    print(f"  Criadas {len(categories)} categorias principais")
    print(f"  Criadas {len(subcategories)} subcategorias")
    
    # Update channels with category_id
    print("[4/4] Atualizando canais com categorias...")
    updated = 0
    uncategorized = 0
    
    for group_name in groups:
        cat_name, sub_name = parse_category(group_name)
        
        # Get category_id
        if sub_name and (cat_name, sub_name) in subcategories:
            cat_id = subcategories[(cat_name, sub_name)]
        elif cat_name in categories:
            cat_id = categories[cat_name]
        else:
            cat_id = None
            uncategorized += 1
        
        if cat_id:
            c.execute("UPDATE iptv_channels SET category_id=? WHERE group_name=? AND source='xtream'", (cat_id, group_name))
            updated += c.rowcount
    
    conn.commit()
    
    # Stats
    c.execute("SELECT COUNT(*) FROM iptv_channels WHERE source='xtream' AND category_id IS NOT NULL")
    with_cat = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM iptv_channels WHERE source='xtream' AND category_id IS NULL")
    without_cat = c.fetchone()[0]
    
    print(f"\n{'=' * 60}")
    print(f"  DONE!")
    print(f"  Canais categorizados: {with_cat}")
    print(f"  Canais sem categoria: {without_cat}")
    
    # Show category stats
    c.execute("""
        SELECT c.name, c.icon, COUNT(ch.id) as cnt 
        FROM iptv_categories c 
        LEFT JOIN iptv_channels ch ON ch.category_id = c.id 
        WHERE c.parent_id IS NULL
        GROUP BY c.id 
        ORDER BY cnt DESC 
        LIMIT 20
    """)
    cats = c.fetchall()
    print(f"\n  Top categorias:")
    for name, icon, cnt in cats:
        print(f"    {icon} {name}: {cnt} canais")
    
    conn.close()

if __name__ == "__main__":
    main()
