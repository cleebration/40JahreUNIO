#!/usr/bin/env python3
"""
Erzeugt src/data.js aus den Typeform-Einsendungen (40 Jahre UNIO, 2019).
Quelle: Google-Sheet "2026 cleebration Content" -> Projekt 40jahreunio.
Bereinigt offensichtliche Eingabefehler (z. B. E-Mail im Titelfeld, kaputtes
Geburtsjahr). Vergibt eindeutige, sprechende Slugs fuer /werk/<slug>.
"""
import json, re, unicodedata

# ---------------------------------------------------------------------------
# Motive = Saetze aus Mussorgskis "Bilder einer Ausstellung" (= Ausstellungs-
# raeume). Reihenfolge wie in der Suite. Farbe = "Buntstift"-Index je Raum.
# ---------------------------------------------------------------------------
MOTIFS = [
    ("gnom",         "Der Gnom",                       "Gnomus",                         "#E4572E"),
    ("schloss",      "Das alte Schloss",               "Il vecchio castello",            "#3F8E6E"),
    ("tuilerien",    "Die Tuilerien",                  "Spielende Kinder im Streit",     "#E8A13A"),
    ("ochsenkarren", "Der Ochsenkarren",               "Bydło",                          "#9A6B3F"),
    ("kuechlein",    "Ballett der Küchlein",           "in ihren Eierschalen",           "#EBC34B"),
    ("limoges",      "Limoges. Der Marktplatz",        "Die große Neuigkeit",            "#DD7FA6"),
    ("katakomben",   "Die Katakomben",                 "Römische Gruft",                 "#5B6C8F"),
    ("tote-sprache", "Mit den Toten in einer toten Sprache", "Cum mortuis in lingua mortua", "#6E6678"),
    ("baba-jaga",    "Die Hütte der Baba-Jaga",        "Die Hütte auf Hühnerfüßen",      "#7B4B94"),
    ("tor-von-kiew", "Das große Tor von Kiew",         "Das Heldentor in der alten Hauptstadt", "#C2412F"),
]
MOTIF_KEYS = {m[0] for m in MOTIFS}

# ---------------------------------------------------------------------------
# Einsendungen: (vorname, nachname, jahr, motiv, technik, titel, datei)
# ---------------------------------------------------------------------------
ROWS = [
    ("Maria","Wallner",1959,"tor-von-kiew","Collage","Livemusik in Kiew","75392727_809950276104673_358034916245504000_n.jpg"),
    ("Caroline","Schiller",2011,"baba-jaga","Farbstifte","Hexenhaus","76232071_2427512944182684_8808104374992633856_n.jpg"),
    ("Valentina","Stelzhammer",2009,"schloss","Farbstifte","Mein Traumschloss","78124200_792765194506448_8992540874957127680_n.jpg"),
    ("Jana","Lenglachner",2012,"schloss","Farbstifte","Ein Schloss in meiner Nähe","73523458_576362832935694_8433799237866618880_n.jpg"),
    ("Valentina","Stelzhammer",2009,"schloss","Farbstifte","Mein Traumschloss","73523458_576362832935694_8433799237866618880_n.jpg"),
    ("Iris","Brandstetter",2007,"schloss","Bleistift","","Das_alte_Schloss.jpg"),
    ("Kerstin","Schmollmüller",1976,"schloss","Aquarell","","Das_alte_Schloß_2.jpg"),
    ("Debora","Hufnagel",2008,"tor-von-kiew","Farbstifte","","3731_001.jpg"),
    ("Valentin","Malicky",2008,"baba-jaga","Buntstifte","Baba Jaga","15735738003421672918895796894456.jpg"),
    ("Fridolin","Malicky",2005,"tor-von-kiew","Bleistift","Das Tor zu Kiew","15735735205164486727015421004124.jpg"),
    ("Klavierschüler","der LMS Schwanenstadt",2009,"baba-jaga","Farbstifte","Baumhäuser","Baumhäuser.jpg"),
    ("Klavierschüler","der LMS Schwanenstadt",2009,"schloss","Farbstifte","Schlösser am Rand der Donaustadt Linz","Schlösser_am_Rand_der_Donaustadt_Linz.jpg"),
    ("Johanna","Siller",2011,"gnom","Farbstifte","Der Gnom","Gnom_JohannaSiller_1.bmp"),
    ("Johanna","Siller",2011,"baba-jaga","Farbstifte","Hütte auf Hühnerfüßen","Huette_JohannaSiller_3.bmp"),
    ("Theresa","Siller",2017,"gnom","Filzstifte","Der Gnom","Gnom_TheresaSiller_1.bmp"),
    ("Magdalena","Siller",2008,"baba-jaga","Buntstifte","Hütte auf Hühnerfüßen","Huette_MagdalenaSiller_1.bmp"),
    ("Maria","Wallner",1959,"schloss","Collage","Das alte Schloss","Das_alte_Schloss.jpg"),
    ("Verena","Renner",1993,"tuilerien","Collage","","IMG_0461.JPG"),
    ("Verena","Renner",1993,"tuilerien","Linolschnitt-Druck mit Acrylfarbe","","27F616F3_819A_410D_9F94_7C6742078A6B.jpg"),
    ("Verena","Renner",1993,"tuilerien","Linolschnitt-Druck mit Acrylfarbe","","370EDEC8_25D1_4618_A63E_F2F1E1CFBBE5.jpg"),
    ("Verena","Renner",1993,"tuilerien","Tusche und Acryl auf Holzplatte","","IMG_3947.PNG"),
    ("Verena","Renner",1993,"tuilerien","Acryl auf Leinwand mit Notenblättern","","IMG_3946.PNG"),
    ("Paula","Haslinger",2005,"gnom","Bleistift","","Paula_Haslinger_2005.JPG"),
    ("Anja","Riegler",2005,"gnom","Bleistift","","Anja_Riegler_2005.JPG"),
    ("Sebastian","Langegger",2007,"gnom","Deckfarben","","Sebastian_Langegger_2007.JPG"),
    ("Rafael","Viertlmayr",2008,"gnom","Aquarell","","Rafael_Viertlmayr_2008.JPG"),
    ("Veronika","Sigl",2008,"gnom","Deckfarben","","Veronika_Siegl_2008.JPG"),
    ("Selina","Stegfellner",2008,"gnom","Deckfarben","","Stegfellner_Selina_2007.JPG"),
    ("Leonhard","Grandl",2007,"baba-jaga","Deckfarben","","Leonhard_Grandl_2007.JPG"),
    ("Viktorie","Raabova",2001,"ochsenkarren","Wasserfarben","","Ochsenkarren_v.jpg"),
    ("Magdalena","Honeder",2007,"baba-jaga","Deckfarben","","Magdalena_Honeder_2007.JPG"),
    ("Rolf","Conrath",1942,"tor-von-kiew","Filzstifte","","Tor.jpg"),
    ("Lisa","Langthaler",2007,"baba-jaga","Deckfarben","","Lisa_Langthaler_2007.JPG"),
    ("Josef","Brandner",2004,"schloss","Wasserfarben","","Altes_Schloss_J.jpg"),
    ("Magdalena","Gusenbauer",2007,"baba-jaga","Deckfarben","","Magdalena_Gusenbauer_2007.JPG"),
    ("Jakob","Brandner",2010,"gnom","Wasserfarben","","Gnomus_j.jpg"),
    ("Katharina","Peirleitner",2006,"gnom","Deckfarben","","Katharina_Peirleitner_2006.JPG"),
    ("Rolf","Conrath",1942,"tuilerien","Filzstifte","","Tulerien_1.jpg"),
    ("Vanessa","Schmalzer",2006,"gnom","Deckfarben","","Vanessa_Schmalzer_2006.JPG"),
    ("Monja","Zehethofer",2006,"gnom","Farbstifte","","Monja_Zehethofer.JPG"),
    ("Rolf","Conrath",1942,"ochsenkarren","Filzstifte","","Ochsenkarren_1.jpg"),
    ("Rolf","Conrath",1942,"schloss","Filzstifte","","Altes_Schloss.JPG"),
    ("Arthur","Zangl",2004,"schloss","Farbstifte","","Arthur_Zangl_2004.JPG"),
    ("Rolf","Conrath",1942,"gnom","Filzstifte","","Gnomus.jpg"),
    ("Alina","Wolfinger",2008,"baba-jaga","Aquarell","","Alina_Wolfinger_Bodendorf_182_4223_Katsdorf__2008.JPG"),
    ("Xandria","Furchtlehner",2006,"tuilerien","Farbstifte","Der Streit um das kaputte Boot","Xandria_Furchtlehner_2006.JPG"),
    ("Sarah","Lengauer",2007,"tuilerien","Farbstifte","","Sarah_Lengauer_2007.JPG"),
    ("Tina","Höllmüller",2006,"gnom","Deckfarben","","Tina_Höllmüller_2006.JPG"),
    ("Sebastian","Tichler",2005,"baba-jaga","Deckfarben","","Sebastian_Tichler_2005.JPG"),
    ("Sophia","Schatz",2008,"baba-jaga","Deckfarben","","Sophia_Schatz2008.JPG"),
    ("Sebastian","Röschel",2005,"baba-jaga","Filzstifte","","Sebastian_Röschel.JPG"),
    ("Samuel","Hackl",2005,"baba-jaga","Farbstift","","Hackl_Samuel_2005.JPG"),
    ("Patrick","Pamminger",2006,"baba-jaga","Bleistiftzeichnung","","Patrick_Pamminger_2006.JPG"),
    ("Theresa","Schinnerl",2006,"gnom","Bleistiftzeichnung","","Theresa_Schinnerl_2006.JPG"),
    ("Tina","Höllmüller",2006,"gnom","Deckfarben","","Tina_Höllmüller_2006.JPG"),
    ("Jana","Mückstein",2006,"gnom","Deckfarben","","Jana_Mückstein_2006.JPG"),
    ("Felix","Höllwirth",2006,"schloss","Farbstifte","","Felix_Höllwirth_2006.JPG"),
    ("Lena","Fetzer",2005,"schloss","Farbstifte","","Lena_Fetzer_2005.JPG"),
    ("Marvin","Pils",2006,"baba-jaga","Farbstifte","","Marvin_Pils_2006.JPG"),
    ("Daniel","Feichtner",2006,"baba-jaga","Farbstifte","","Daniel_Feichtner_2006.JPG"),
    ("Fabian","Röbl",2006,"baba-jaga","Farbstifte","Hexenhaus","Fabian_Röbl_2006.JPG"),
    ("Leonie","Aistleitner",2008,"gnom","Aquarell und Farbstifte","Der Gnom","Gnom__Leonie_Aistleitner_Standorf_2_4223_Katsdorf_2008.jpg"),
    ("Sarah","Poltschak",2013,"baba-jaga","Buntstift auf Papier","Haus auf Hühnerfüßen","Haus_auf_Hühnerfuessen.pdf"),
    ("Emily","Radner",2010,"tuilerien","Farbstift","","Radner_Emily_Tuileries.pdf"),
    ("Emily","Radner",2010,"schloss","Farbstift","","Radner_Emily_Schloss.pdf"),
    ("Emily","Radner",2010,"tor-von-kiew","Farbstift","","Radner_Emily_gr._Tor.pdf"),
    ("Emily","Radner",2010,"gnom","Farbstift","","Radner_Emily_Der_Gnom.pdf"),
    ("Emily","Radner",2010,"ochsenkarren","Farbstift","","Radner_Emily_Bydlo.pdf"),
    ("Anton","Niedermayr",2007,"baba-jaga","Farbstift","","Anton_Niedermayr.pdf"),
    ("Daniel","Kurz-Reichmann",2008,"gnom","Farbstift","","Daniel_Kurz_Reichmann.pdf"),
    ("Julian","Buchendorfer",2006,"tor-von-kiew","Farbstifte","Das große Tor von Kiew","20191101_152244.jpg"),
    ("Darja","Bauer",2008,"baba-jaga","Mischtechnik","","darja_bauer.jpg"),
    ("Emma","Einberger",2008,"gnom","Wasserfarben","","emma_einberger.jpg"),
    ("Marie","Baumgartner",2008,"gnom","Ölkreiden","","marie_baumgartner.JPG"),
    ("Maximilian","Paltinger",2008,"gnom","Mischtechnik","","maximilian_paltinger.jpg"),
    ("Moritz","Rauter",2008,"gnom","Mischtechnik","","moritz_rauter.JPG"),
    ("Valentin","Stux",2008,"gnom","Mischtechnik","","valentin_stux.jpg"),
    ("Tobias","Ortmayr",2008,"gnom","Ölkreiden","","tobias_ortmayr.JPG"),
    ("Sarah","Pfannerer",2008,"gnom","Mischtechnik","","sarah_pfannerer.JPG"),
    ("Genoveva","Peia",2008,"gnom","Mischtechnik","","genoveva_peia.jpg"),
    ("Carla","Eckl",2008,"gnom","Mischtechnik","","carla_eckl.JPG"),
    ("Anna","Kosilek",2008,"gnom","Mischtechnik","","anna_kosilek.jpg"),
    ("Elias","Lagler",2008,"baba-jaga","Farbstifte","","elias_lagler.jpg"),
    ("Paul","Rungger",2008,"baba-jaga","Ölkreiden","","paul_rungger.JPG"),
    ("Emma","Kimmerstorfer",2008,"baba-jaga","Mischtechnik","","emma_kimmerstorfer.jpg"),
    ("Helene","Aichinger",2008,"baba-jaga","Mischtechnik","","helene_aichinger.jpg"),
    ("Sarah","Palfi",2008,"baba-jaga","Wasserfarben","","sarah_palfi.JPG"),
    ("Tamina","Reischl",2008,"baba-jaga","Wasserfarben","","tamina_reischl.JPG"),
    ("Katharina","Burgstaller",2008,"baba-jaga","Wasserfarben","","katharina_burgstaller.jpg"),
    ("Emilia","Thalhammer",2008,"baba-jaga","Bleistiftzeichnung","","emilia_thalhammer.jpg"),
    ("Aurelia","Rogner",2008,"baba-jaga","Wasserfarben","","aurelia_rogner.jpg"),
    ("Andreas","Hofer",2008,"baba-jaga","Wasserfarben","","andreas_hofer.JPG"),
    ("Jakob","Weinberger",2011,"ochsenkarren","Buntstifte","Der Ochsenkarren","IMG_20191030_192242.jpg"),
    ("Theresa","Pöll",2013,"baba-jaga","Wasserfarben und Filzstifte","Gruselhaus","IMG_20191016_171301.jpg"),
    ("Theresa","Pöll",2013,"schloss","Wasserfarben","Altes Schloss mit Wassergraben","IMG_20191016_164545.jpg"),
    ("Mathias","Schablinger",2006,"gnom","Digital (Zeichenprogramm)","Der Gnom","IMG_20191028_132208.png"),
    ("Linda","Lanza",2008,"gnom","Graphitstifte","Ein Gnom bei der Gartenarbeit","20191023_124816.jpg"),
    ("Hubert","Schernhammer",2008,"schloss","Grafitzeichnung","Das alte Schloss","15718276986792110442015840309819.jpg"),
    ("Mika","Kaltenberger",2007,"schloss","Grafitzeichnung","Das alte Schloss","15718710322841584571163.jpg"),
    ("Dillon","Rowan",2008,"gnom","Graphitstift","Der Gartengnom","15718278822953273877206374563034.jpg"),
    ("Alex","Makel",2006,"baba-jaga","Graphit- und Bleistiftzeichnung","","1571827133959_1379819582.jpg"),
    ("Elisabeth","Hufnagl",1996,"baba-jaga","Fotografie","Hütte der Baba-Jaga, gesichtet in Edt bei Lambach","IMG_20190310_WA0003.jpg"),
    ("Poldi","Plaimer",1950,"limoges","Acryl, Aquarell","7. Strömung","7.STRÖMUNG___ACRYL____40_x_50_cm.._Collage__teilweise_gepachtelt.jpg"),
    ("Poldi","Plaimer",1950,"katakomben","Acryl, Collage","9. Mondlicht","9.MONDLICHT_1___ACRYL___40_x50_cm.._Collage_mit_Struktur_und__Spiegeln.jpg"),
    ("Poldi","Plaimer",1959,"katakomben","Acryl","33. Sommerwind","33._SOMMERWIND___ACRYL____40_x50_cm..Diagonale_gespachtelt.jpg"),
    ("Poldi","Plaimer",1950,"kuechlein","Aquarell","34. Sonnengold","34.SONNENGOLD_1___ACRYL___40_x50_cm__Collage_mit_Sruktur_und_Spiegeln.jpg"),
    ("Poldi","Plaimer",1950,"limoges","Acryl","65. Glaube Hoffnung Liebe","65._GLAUBE_HOFFNUNG_LIEBE.jpg"),
    ("Valentina","Öller",2011,"gnom","Filzstift","Die Rocker-Katze","D9C719AA_46A9_4370_B89C_24D1C76A0841.jpeg"),
    ("Emilia","Brandner",2001,"tuilerien","Holzstifte","Geschmolzen","15699424994861493660745.jpg"),
    ("Franz","Hochreiter",1959,"ochsenkarren","Acryl auf Papier","Ochsen-Tor","Malerei_Großformat_13_14_010.JPG"),
    ("Franz","Hochreiter",1959,"baba-jaga","Acryl auf Leinwand","Baba-Jaga","1.JPG"),
    ("Franz","Hochreiter",1959,"tote-sprache","Acryl auf Karton","Am „Runden Tisch“","7.JPG"),
    ("Franz","Hochreiter",1959,"schloss","Acryl auf Leinwand","Nach Zwölf","3.JPG"),
    ("Franz","Hochreiter",1959,"tuilerien","Acryl auf Papier","Das mache ich spielend","Malerei_Großformat_13_14_008.JPG"),
    ("Franz","Hochreiter",1959,"gnom","Acryl auf Leinwand","Der Gnom","2.JPG"),
    ("Maximilian und Valentin","Huber",2015,"katakomben","Acrylfarbe mit Fingern","Sturm","DSC_1545.JPG"),
    ("Johann","Mayrhofer",2013,"tor-von-kiew","Farbstift mit Wasser","","p20033681_18.09.2019___002_.pdf"),
    ("Sarah","Poltschak",2013,"schloss","Farbstift auf Papier","Das alte Schloss","Das_alte_Schloss.pdf"),
    ("Emil Jakob","Guttmann",2016,"baba-jaga","Aquarell","Ein spannender Morgen","Emil_Jakob_Guttmann.jpg"),
    ("Anja","Rosenauer",2001,"tote-sprache","Digital","","Screenshot_20170608_213342.png"),
    ("Sebastian","Poltschak",1988,"schloss","Fotografie","Ente in New York","Ente.jpg"),
]

def cap_first(s):
    return s[:1].upper() + s[1:] if s else s

def slugify(s):
    s = s.replace("ä","ae").replace("ö","oe").replace("ü","ue").replace("ß","ss")
    s = s.replace("Ä","ae").replace("Ö","oe").replace("Ü","ue")
    s = unicodedata.normalize("NFKD", s).encode("ascii","ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+","-", s).strip("-").lower()
    return s or "werk"

motif_title = {k:(t,sub,c) for (k,t,sub,c) in MOTIFS}

works = []
seen = {}
for i,(vn,nn,jahr,motiv,technik,titel,datei) in enumerate(ROWS, start=1):
    assert motiv in MOTIF_KEYS, f"Unbekanntes Motiv: {motiv}"
    name = f"{cap_first(vn)} {cap_first(nn)}".strip()
    base = slugify(f"{vn}-{nn}-{motiv}")
    slug = base
    n = seen.get(base, 0)
    if n:
        slug = f"{base}-{n+1}"
    seen[base] = n + 1
    t, sub, color = motif_title[motiv]
    works.append({
        "id": i,
        "slug": slug,
        "name": name,
        "vorname": cap_first(vn),
        "nachname": cap_first(nn),
        "jahr": jahr,
        "motif": motiv,
        "motifTitle": t,
        "technik": technik,
        "titel": titel,
        "file": datei,
        "image": f"/werke/{slug}.jpg",
    })

motifs_js = [{"key":k,"title":t,"subtitle":sub,"color":c} for (k,t,sub,c) in MOTIFS]

header = (
    "// AUTOGENERIERT von scripts/generate-data.py – bitte nicht von Hand editieren.\n"
    "// Quelle: Typeform-Einsendungen \u201e40 Jahre UNIO\u201c (2019),\n"
    "// Jubil\u00e4umskonzert 21.11.2019 im Brucknerhaus Linz.\n\n"
)
out = header
out += "export const MOTIFS = " + json.dumps(motifs_js, ensure_ascii=False, indent=2) + ";\n\n"
out += "export const WORKS = " + json.dumps(works, ensure_ascii=False, indent=2) + ";\n"

with open("src/data.js","w",encoding="utf-8") as f:
    f.write(out)

# kleine Statistik
from collections import Counter
by_motif = Counter(w["motif"] for w in works)
people = {(w["vorname"], w["nachname"]) for w in works}
print(f"Werke: {len(works)}")
print(f"Personen (eindeutig): {len(people)}")
print("Pro Motiv:")
for k,t,sub,c in MOTIFS:
    print(f"  {t:35s} {by_motif.get(k,0)}")
slugs = [w['slug'] for w in works]
assert len(slugs) == len(set(slugs)), "Slug-Kollision!"
print("Alle Slugs eindeutig: OK")
