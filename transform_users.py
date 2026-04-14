import re

with open(r'c:\Users\DELL\Downloads\mdmprojet\insert_users.sql', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Extract the VALUES block
values_start = content.index('VALUES') + len('VALUES')
values_text = content[values_start:].strip()

# Remove trailing semicolon if present
if values_text.endswith(';'):
    values_text = values_text[:-1]

# Parse each row using a state machine (handles quoted strings with commas)
def parse_sql_values(text):
    rows = []
    depth = 0
    in_string = False
    current_row = []
    current_val = ''
    i = 0
    while i < len(text):
        c = text[i]
        if c == "'" and not in_string:
            in_string = True
            current_val += c
        elif c == "'" and in_string:
            # Check for escaped quote ''
            if i+1 < len(text) and text[i+1] == "'":
                current_val += "''"
                i += 2
                continue
            in_string = False
            current_val += c
        elif c == '(' and not in_string:
            if depth == 0:
                current_val = ''
                current_row = []
            depth += 1
        elif c == ')' and not in_string:
            depth -= 1
            if depth == 0:
                current_row.append(current_val.strip())
                rows.append(current_row)
                current_val = ''
                current_row = []
        elif c == ',' and not in_string and depth == 1:
            current_row.append(current_val.strip())
            current_val = ''
        else:
            current_val += c
        i += 1
    return rows

rows = parse_sql_values(values_text)
print(f'Parsed {len(rows)} rows')
if rows:
    print(f'First row has {len(rows[0])} values')
    print(f'Sample row[0]: {rows[0]}')

# Column index mapping (0-based) from old schema:
# 0:EMPLOYE_ID, 1:MATRICULE, 2:NOM, 3:PRENOM, 4:NAISSANCE_DAT, 5:CIVILITE_COD,
# 6:SITUATION_COD, 7:ENFANT_NB, 8:IDENTITE_TYP, 9:IDENTITE_VAL, 10:CONTRAT_TYP,
# 11:EMBAUCHE_DAT, 12:SORTIE_DAT, 13:AGENCE_COD, 14:DIRECTION_COD, 15:SERVICE_COD,
# 16:FONCTION_COD, 17:ADRESSE1, 18:POSTAL_COD1, 19:VILLE_COD, 20:TELEPHONE1,
# 21:GSM, 22:FONCTION_EXP, 23:CONTRAT_DATEFIN, 24:Photo

# Users entity fields:
# matricule(1), nom(2), prenom(3), cin(9), address(17), tel(20 or 21 if 20 is NULL),
# dateEmbauche(11), dateDesactiver(12 if has value), dateDetacher(NULL - no equivalent),
# status(derived: 'desactiver' if SORTIE_DAT else 'active'),
# fonction(22), fonction_id(16), departement_id(15), agence_id(13)

def clean_date(val):
    """Convert date strings like '1997-08-01 00:00:00.000' to 'YYYY-MM-DD'"""
    val = val.strip()
    if val.upper() == 'NULL' or val == '':
        return 'NULL'
    # Remove quotes
    if val.startswith("'") and val.endswith("'"):
        inner = val[1:-1].strip()
        # Extract date portion
        if ' ' in inner:
            inner = inner.split(' ')[0]
        return f"'{inner}'"
    return val

def clean_val(val):
    """Clean up whitespace in values"""
    val = val.strip()
    if val.upper() == 'NULL' or val == '':
        return 'NULL'
    return val

def clean_int(val):
    """Clean integer values"""
    val = val.strip()
    if val.upper() == 'NULL' or val == '':
        return 'NULL'
    # Remove extra spaces within the value (like '13        ')
    try:
        return str(int(val))
    except ValueError:
        return val

def force_string(val):
    """Ensure a value is quoted as a string (for tel/phone fields)"""
    val = val.strip()
    if val.upper() == 'NULL' or val == '':
        return 'NULL'
    # Already quoted
    if val.startswith("'") and val.endswith("'"):
        return val
    # Wrap unquoted values in quotes
    return f"'{val}'"

def clean_string(val):
    """Clean string values"""
    val = val.strip()
    if val.upper() == 'NULL' or val == '':
        return 'NULL'
    return val

def get_tel(telephone1, gsm):
    """Return telephone1 if not null, else gsm - always quoted as string"""
    t1 = telephone1.strip()
    if t1.upper() != 'NULL' and t1 != '':
        return force_string(t1)
    g = gsm.strip()
    if g.upper() != 'NULL' and g != '':
        return force_string(g)
    return 'NULL'

def get_status(sortie_dat):
    """Derive status from SORTIE_DAT"""
    val = sortie_dat.strip()
    if val.upper() == 'NULL' or val == '':
        return "'active'"
    return "'desactiver'"

output_rows = []
for row in rows:
    if len(row) < 25:
        # Pad with NULLs if needed
        while len(row) < 25:
            row.append('NULL')
    
    matricule = clean_int(row[1])
    nom = clean_string(row[2])
    prenom = clean_string(row[3])
    cin = clean_string(row[9])
    address = clean_string(row[17])
    tel = get_tel(row[20], row[21])
    date_embauche = clean_date(row[11])
    date_desactiver = clean_date(row[12])  # SORTIE_DAT -> dateDesactiver
    date_detacher = 'NULL'  # no source
    status = get_status(row[12])
    fonction = clean_string(row[22])
    fonction_id = clean_int(row[16])  # FONCTION_COD -> fonction_id
    departement_id = clean_int(row[15])  # SERVICE_COD -> departement_id
    agence_id = clean_int(row[13])  # AGENCE_COD -> agence_id
    
    output_rows.append(
        f"    ({matricule}, {nom}, {prenom}, {cin}, {address}, {tel}, "
        f"{date_embauche}, {date_desactiver}, {date_detacher}, {status}, "
        f"{fonction}, {fonction_id}, {departement_id}, {agence_id})"
    )

# Build output SQL
header = "INSERT INTO users (matricule, nom, prenom, cin, address, tel, dateEmbauche, dateDesactiver, dateDetacher, status, fonction, fonction_id, departement_id, agence_id)"
sql_output = header + "\nVALUES\n" + ",\n".join(output_rows) + ";\n"

out_path = r'c:\Users\DELL\Downloads\mdmprojet\insert_users.sql'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(sql_output)

print(f"Done! Written {len(output_rows)} rows to {out_path}")
print(f"Sample first new row:\n{output_rows[0]}")
print(f"Sample last new row:\n{output_rows[-1]}")
