#!/usr/bin/env python3
"""Add bio keys v2 (studio, Zé, encounters, influences) to all lang files."""
import json, collections

EN = {
  "bio.era-studio": "The home studio",
  "bio.h2-studio": "Two tape recorders and a stack of reel-to-reels",
  "bio.p-studio-1": "The first recordings came from a setup as simple as it was ingenious: two cassette recorders, bouncing tracks from one to the other, layer after layer, until a song existed. That is where recording stopped being magic and became craft.",
  "bio.p-studio-2": "His father fed the obsession, buying old reel-to-reel recorders and bringing them home. On those machines Rodrigo taught himself sound engineering, trial by error, and that autodidact school later paid for itself: Regra Zero ended up recorded and mixed by the musician himself.",
  "bio.p-brothers-1": "His brother Lauro was the door. He showed him the first movements on the violão and on the keyboard, hand over hand, the way these things are actually transmitted. It was at their uncle Zé's house that Lauro played him Sultans of Swing for the first time, and uncle Zé himself who put Telegraph Road on soon after, the two tracks that opened the road to Dire Straits, The Beatles, Pink Floyd, Led Zeppelin, Rush, JJ Cale and Peter Gabriel, the whole canon entering the house one record at a time.",
  "bio.p-brothers-3": "And the singing came from both shores of the ocean. On voice, Sting and Michael Bolton. From Brazil, Legião Urbana, Barão Vermelho, Djavan, Tim Maia and Roupa Nova, the national songbook played side by side with the rock imports.",
  "bio.era-mk": "Encounters",
  "bio.p-mk-1": "The myth had been dismantled at home long before. His father owned a bus, and helped with the production of Rock Estrela: music as work, gear in the luggage, a show that happens because someone drives, loads and sets it all up. Seeing it from the inside taught more than any mystique.",
  "bio.p-mk-2": "In 2000 came the encounters with the masters themselves: Mark Knopfler, crossed three times in Rio de Janeiro, plus Stanley Jordan and Mike Stern, close enough to see the gods of the guitar working up close. The lesson that stayed: the heroes are workers. Mastery is not magic; it is craft, repeated for decades, and it can be learned by anyone willing to put in the hours. The myth fell. The music remained."
}

PT = {
  "bio.era-studio": "O estúdio caseiro",
  "bio.h2-studio": "Dois gravadores e uma pilha de rolos",
  "bio.p-studio-1": "As primeiras gravações saíram de um aparato tão simples quanto engenhoso: dois gravadores de fita cassete, pingando as trilhas de um para o outro, camada sobre camada, até que a música existisse. Foi ali que gravar deixou de ser magia e virou ofício.",
  "bio.p-studio-2": "O pai alimentava a obsessão, comprando gravadores de rolos antigos e trazendo para casa. Nessas máquinas Rodrigo aprendeu sozinho engenharia de som, no erro e no acerto, e essa escola autodidata depois se pagou: o Regra Zero acabou gravado e mixado pelo próprio músico.",
  "bio.p-brothers-1": "O irmão Lauro foi a porta. Passou os primeiros movimentos no violão e no teclado, mão na mão, do jeito que essas coisas realmente se transmitem. Foi na casa do tio Zé que o Lauro colocou Sultans of Swing pela primeira vez, e o próprio tio Zé que pôs Telegraph Road logo em seguida, as duas faixas que abriram a estrada para Dire Straits, The Beatles, Pink Floyd, Led Zeppelin, Rush, JJ Cale e Peter Gabriel, o cânone inteiro entrando em casa um disco por vez.",
  "bio.p-brothers-3": "E o canto veio das duas margens do oceano. Na voz, Sting e Michael Bolton. Do Brasil, Legião Urbana, Barão Vermelho, Djavan, Tim Maia e Roupa Nova, o cancioneiro nacional tocando lado a lado com os imports do rock.",
  "bio.era-mk": "Encontros",
  "bio.p-mk-1": "O mito já tinha sido desmontado em casa muito antes. O pai tinha um ônibus e ajudou na produção do Rock Estrela: música como trabalho, equipamento na mala, show que acontece porque alguém dirige, carrega e monta tudo. Ver aquilo de dentro ensinou mais do que qualquer mistificação.",
  "bio.p-mk-2": "Em 2000 vieram os encontros com os mestres: Mark Knopfler, cruzado três vezes no Rio de Janeiro, além de Stanley Jordan e Mike Stern, perto o bastante para ver os deuses da guitarra trabalhando de perto. A lição que ficou: os heróis são trabalhadores. Maestria não é magia; é ofício repetido por décadas, e pode ser aprendido por quem colocar as horas. O mito caiu. A música ficou."
}

ES = {
  "bio.era-studio": "El estudio casero",
  "bio.h2-studio": "Dos grabadoras y una pila de rollos",
  "bio.p-studio-1": "Las primeras grabaciones salieron de un aparato tan simple como ingenioso: dos grabadoras de cinta, pasando las pistas de una a otra, capa sobre capa, hasta que la canción existiera. Ahí grabar dejó de ser magia y se volvió oficio.",
  "bio.p-studio-2": "Su padre alimentaba la obsesión, comprando grabadoras de carrete antiguas y trayéndolas a casa. En esas máquinas Rodrigo se enseñó a sí mismo ingeniería de sonido, a puro error y acierto, y esa escuela autodidacta después se pagó sola: Regra Zero acabó grabado y mezclado por el propio músico.",
  "bio.p-brothers-1": "Su hermano Lauro fue la puerta. Le pasó los primeros movimientos en la guitarra y el teclado, mano a mano, como realmente se transmiten estas cosas. Fue en la casa del tío Zé donde Lauro le puso Sultans of Swing por primera vez, y el propio tío Zé quien puso Telegraph Road después, las dos canciones que abrieron el camino a Dire Straits, The Beatles, Pink Floyd, Led Zeppelin, Rush, JJ Cale y Peter Gabriel, el canon entero entrando en casa un disco a la vez.",
  "bio.p-brothers-3": "Y el canto vino de las dos orillas del océano. En la voz, Sting y Michael Bolton. De Brasil, Legión Urbana, Barón Rojo, Djavan, Tim Maia y Roupa Nova, el cancionero nacional sonando junto a los importados del rock.",
  "bio.era-mk": "Encuentros",
  "bio.p-mk-1": "El mito ya se había desmontado en casa mucho antes. Su padre tenía un bus y ayudó en la producción del Rock Estrela: música como trabajo, equipo en la maleta, un show que ocurre porque alguien maneja, carga y monta todo. Verlo desde adentro enseñó más que cualquier misticismo.",
  "bio.p-mk-2": "En 2000 llegaron los encuentros con los maestros: Mark Knopfler, cruzado tres veces en Río de Janeiro, además de Stanley Jordan y Mike Stern, lo bastante cerca para ver a los dioses de la guitarra trabajando de cerca. La lección que quedó: los héroes son trabajadores. La maestría no es magia; es oficio repetido por décadas, y puede aprenderlo quien ponga las horas. El mito cayó. La música quedó."
}

FR = {
  "bio.era-studio": "Le studio maison",
  "bio.h2-studio": "Deux magnétophones et une pile de bandes",
  "bio.p-studio-1": "Les premiers enregistrements sont nés d'un dispositif aussi simple qu'ingénieux : deux magnétophones à cassettes, reportant les pistes de l'un à l'autre, couche après couche, jusqu'à ce que la chanson existe. C'est là qu'enregistrer a cessé d'être magie pour devenir métier.",
  "bio.p-studio-2": "Son father nourrissait l'obsession, achetant de vieux magnétophones à bandes et les rapportant à la maison. Sur ces machines, Rodrigo s'est enseigné l'ingénierie du son, à force d'erreurs, et cette école autodidacte s'est ensuite payée toute seule : Regra Zero a fini enregistré et mixé par le musicien lui-même.",
  "bio.p-brothers-1": "Son frère Lauro fut la porte. Il lui a passé les premiers mouvements à la guitare et au clavier, main dans la main, comme ces choses se transmettent vraiment. C'est dans la maison de l'oncle Zé que Lauro lui a fait écouter Sultans of Swing pour la première fois, et l'oncle Zé lui-même qui a mis Telegraph Road juste après, les deux titres qui ont ouvert la route vers Dire Straits, The Beatles, Pink Floyd, Led Zeppelin, Rush, JJ Cale et Peter Gabriel, le canon entier entrant chez eux disque après disque.",
  "bio.p-brothers-3": "Et le chant est venu des deux rives de l'océan. À la voix, Sting et Michael Bolton. Du Brésil, Legião Urbana, Barão Vermelho, Djavan, Tim Maia et Roupa Nova, le recueil national jouant côte à côte avec les imports du rock.",
  "bio.era-mk": "Rencontres",
  "bio.p-mk-1": "Le mythe avait déjà été démonté à la maison bien avant. Son père possédait un bus et a aidé à la production du Rock Estrela : la musique comme travail, le matériel dans le coffre, un show qui existe parce que quelqu'un conduit, charge et installe tout. Le voir de l'intérieur a enseigné plus que toute mystification.",
  "bio.p-mk-2": "En 2000 sont venues les rencontres avec les maîtres eux-mêmes : Mark Knopfler, croisé trois fois à Rio de Janeiro, plus Stanley Jordan et Mike Stern, assez près pour voir les dieux de la guitare travailler. La leçon qui reste : les héros sont des travailleurs. La maîtrise n'est pas de la magie ; c'est un métier répété pendant des décennies, et il peut être appris par qui met les heures. Le mythe est tombé. La musique est restée."
}

DE = {
  "bio.era-studio": "Das Heimstudio",
  "bio.h2-studio": "Zwei Kassettenrekorder und ein Stapel Bandmaschinen",
  "bio.p-studio-1": "Die ersten Aufnahmen entstanden mit einem Setup so einfach wie genial: zwei Kassettenrekorder, die Spuren von einem zum anderen hin- und herüberspielten, Schicht für Schicht, bis ein Song existierte. Dort hörte das Aufnehmen auf, Magie zu sein, und wurde Handwerk.",
  "bio.p-studio-2": "Sein Vater fütterte die Obsession, kaufte alte Bandmaschinen und brachte sie nach Hause. Auf diesen Maschinen brachte sich Rodrigo Tontechnik selbst bei, durch Trial and Error, und diese autodidaktische Schule bezahlte sich später selbst: Regra Zero wurde am Ende vom Musiker selbst aufgenommen und gemischt.",
  "bio.p-brothers-1": "Sein Bruder Lauro war die Tür. Er zeigte ihm die ersten Bewegungen auf Gitarre und Keyboard, Hand in Hand, so wie diese Dinge wirklich weitergegeben werden. Im Haus von Onkel Zé legte Lauro Sultans of Swing zum ersten Mal auf, und Onkel Zé selbst legte kurz darauf Telegraph Road auf — die zwei Titel, die den Weg öffneten zu Dire Straits, The Beatles, Pink Floyd, Led Zeppelin, Rush, JJ Cale und Peter Gabriel, der ganze Kanon, Platte für Platte.",
  "bio.p-brothers-3": "Und der Gesang kam von beiden Ufern des Ozeans. An der Stimme: Sting und Michael Bolton. Aus Brasilien: Legião Urbana, Barão Vermelho, Djavan, Tim Maia und Roupa Nova, das nationale Liederbuch neben den Rock-Importen.",
  "bio.era-mk": "Begegnungen",
  "bio.p-mk-1": "Der Mythos war zu Hause schon lange vorher demontiert worden. Sein Vater besaß einen Bus und half bei der Produktion von Rock Estrela: Musik als Arbeit, Equipment im Gepäck, ein Show, die passiert, weil jemand fährt, lädt und alles aufbaut. Das von innen zu sehen lehrte mehr als jede Mystifizierung.",
  "bio.p-mk-2": "2000 kamen die Begegnungen mit den Meistern selbst: Mark Knopfler, dreimal in Rio de Janeiro gekreuzt, dazu Stanley Jordan und Mike Stern, nah genug, um den Göttern der Gitarre bei der Arbeit zuzusehen. Die bleibende Lektion: Helden sind Arbeiter. Meisterschaft ist keine Magie; sie ist Handwerk, über Jahrzehnte wiederholt, und kann von jedem gelernt werden, der die Stunden investiert. Der Mythos fiel. Die Musik blieb."
}

JA = {
  "bio.era-studio": "ホームスタジオ",
  "bio.h2-studio": "二台のカセットレコーダーと、積まれたオープンリール",
  "bio.p-studio-1": "最初の録音は、シンプルながら巧妙な仕組みから生まれた：二台のカセットレコーダーでトラックを一方から他方へ落とし込み、層を重ね、曲が完成するまで。録音が魔法ではなく技術になった瞬間だった。",
  "bio.p-studio-2": "父はその情熱を支え、古いオープンリールのレコーダーを買っては家に持ち帰った。その機械でロドリゴは音響エンジニアリングを独学で学び、その学校は後に実を結んだ：Regra Zero はミュージシャン自身の手で録音・ミックスされた。",
  "bio.p-brothers-1": "兄ラウロが扉だった。ギターとキーボードの最初の動きを手取り足取り教えた。ゼー叔父さんの家で、ラウロが初めて「Sultans of Swing」をかけ、ゼー叔父さん自身が続けて「Telegraph Road」をかけた——この二曲が、ダイアー・ストレイツ、ビートルズ、ピンク・フロイド、レッド・ツェッペリン、ラッシュ、J.J. ケイル、ピーター・ガブリエルへの道を開いた。聖典が一枚ずつ家に入ってきた。",
  "bio.p-brothers-3": "そして歌は大洋の両岸から。ボーカルではスティングとマイケル・ボルトン。ブラジルからはレジオン・ウルバーナ、バラオン・ヴェルメーリョ、ジヴァン、チーマイア、ロウパ・ノーヴァ。国民の歌本がロックの輸入盤と並んで鳴っていた。",
  "bio.era-mk": "出会い",
  "bio.p-mk-1": "神話はずっと前に家で解体されていた。父はバスを持っていて、Rock Estrela の制作を手伝っていた：音楽は仕事であり、機材はトランクの中、誰かが運転し、運び、セッティングするからショーが成り立つ。内側から見ることが、どんな神秘化よりも多くを教えた。",
  "bio.p-mk-2": "2000年、巨匠たちとの出会いが来た：マーク・ノップラー（リオで三回すれ違った）、スタンリー・ジョーダン、マイク・スターン。ギターの神々が働く姿を間近で見られる距離だった。残った教訓：ヒーローは労働者だ。熟達は魔法ではなく、何十年も繰り返された技であり、時間を注ぐ者なら誰でも学べる。神話は崩れた。音楽は残った。"
}

ZH = {
  "bio.era-studio": "家庭录音室",
  "bio.h2-studio": "两台录音机和一摞开盘机",
  "bio.p-studio-1": "最早的录音来自一个简单又巧妙的装置：两台卡带录音机，把音轨从一台倒到另一台，一层叠一层，直到一首歌成形。录音从魔法变成了手艺，就在那一刻。",
  "bio.p-studio-2": "父亲给这份痴迷添柴，买来老式开盘录音机带回家。就在那些机器上，罗德里戈自学了录音工程，在错误与尝试中摸索，这所自学的学校后来报答了他：Regra Zero 最终由音乐人自己录音、自己混音。",
  "bio.p-brothers-1": "哥哥劳罗是那扇门。他在吉他和键盘上把最初的动作手把手传给他。正是在泽叔的家里，劳罗第一次给他放了《Sultans of Swing》，泽叔本人紧接着放了《Telegraph Road》——这两首歌打开了通往恐怖海峡、披头士、平克·弗洛伊德、齐柏林飞艇、Rush、J.J. 凯尔和彼得·盖布瑞尔的路，正典一张一张进了家。",
  "bio.p-brothers-3": "歌声则来自大洋两岸。嗓音上有斯汀和迈克尔·波顿。巴西这边，Legião Urbana、Barão Vermelho、Djavan、Tim Maia 和 Roupa Nova，国民歌本和进口摇滚并排放着听。",
  "bio.era-mk": "相遇",
  "bio.p-mk-1": "神话其实早就在家里被拆解了。父亲有一辆大巴，帮过 Rock Estrela 演出的制作：音乐就是工作，设备装进行李箱，演出能发生是因为有人开车、装卸、搭台。从内部看这一切，比任何神秘化都更有教益。",
  "bio.p-mk-2": "2000年，与大师们的相遇来了：马克·诺普弗勒——在里约三次相遇，还有斯坦利·乔丹和迈克·斯特恩，近到能看见吉他之神如何工作。留下来的教训：英雄是劳动者。精通不是魔法；它是重复了几十年的手艺，任何愿意投入时间的人都能学会。神话倒下了。音乐留下了。"
}

LANGS = {'en': EN, 'pt': PT, 'es': ES, 'fr': FR, 'de': DE, 'ja': JA, 'zh-cn': ZH}

for lang, keys in LANGS.items():
    p = f'lang/{lang}.json'
    data = json.load(open(p, encoding='utf-8'), object_pairs_hook=collections.OrderedDict)
    for k, v in keys.items():
        data[k] = v
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2); f.write('\n')
    print('ok', lang)
