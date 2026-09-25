#!/usr/bin/env python3
"""Restore line breaks in data-lyrics attributes (13 songs, 3 pages).
Text preserved verbatim; only \n (verses) and \n\n (sections) added."""
import re, html, sys

L = {}

L["As Melhores Coisas da Vida"] = """Está na hora de você acordar
Olhar em volta e ver o que há
Lá fora e ai dentro o que sente
É sua alma em estado latente

Por que você se deixa levar?
Sem perceber onde a culpa está
Aceitando tudo o que está vendo
Não ligando pros enfermos

Não me obrigue a admitir
Que tenho coisas a fazer por aqui
Quero curtir as melhores coisas da vida
E do trabalho quero fugir

Porque você tenta revocar?
Os direitos que tem de explicar
A calúnia que não deu conta do recado
E se importa com os fatos do passado

Não me obrigue a admitir
Que tenho coisas a fazer por aqui
Quero curtir as melhores coisas da vida
E do trabalho quero fugir

Não é hora de você partir
Dizer adeus pra tudo e desistir
Lá fora está cheio de gente
Que liga pros seus atos delinqüentes

Não me obrigue a admitir
Que tenho coisas a fazer por aqui
Quero curtir as melhores coisas da vida
E do trabalho quero fugir"""

L["Disrupção"] = """Você deve partir
A recompensa é a estrada
Só lhe resta seguir
Sem rota pré-combinada
Escolha o tom do momento
Ao desmontar argumentos
Com a chama da liberdade
Do amor em cada cidade

Use a lua e as curvas da serra
Guiando a máquina com perfeição
Sinfonia que pulsa em terra
Disrupção

A intenção é o motor
De quem navega sem dor
Na trilha feita à mão
Movida a gás e pistão

Use a lua e as curvas da serra
Guiando a máquina com perfeição
Sinfonia que pulsa em terra
Disrupção

E o racional do momento
Solta poeira no vento
Ronco voraz de uma era
Sinais vitais de uma fera

Use a lua e as curvas da serra
Guiando a máquina com perfeição
Sinfonia que pulsa em terra
Disrupção"""

L["Boas Palavras"] = """Boas palavras em mente – ancoradas no sim
Ditas de modo breve – com início, meio e fim
Boas palavras em mente – ancoradas no sim
Ditas de modo breve – com início, meio e fim

Conforme o frio avançava ela se tornava mais forte
Melhorando argumentos – se livrando da sorte
Despertando a cabeça com o próprio amor
Acenando pro mundo – ficando a seu dispor

Durante a interrupção - ela se desfez de crenças
No ar da inteligência reciclou ofensas
Pela respiração seguida de perdão
Trouxe a ideia pra si - libertou compaixão

Boas palavras em mente – ancoradas no sim
Ditas de modo breve – com início, meio e fim
Boas palavras em mente – ancoradas no sim
Ditas de modo breve – com início, meio e fim

E então percebeu que a humildade nada mais é
Conhecer o outro como a própria fé
Despertando a cabeça com o próprio amor
Acenando pro mundo – ficando a seu dispor

Boas palavras em mente – ancoradas no sim
Ditas de modo breve – com início, meio e fim
Boas palavras em mente – ancoradas no sim
Ditas de modo breve – com início, meio e fim"""

L["Escuto Clássico"] = """Um grande colorido paira pelos ares
Não sei se é ali esquina ou em Buenos Aires
Aqui no rio tudo continua na mesma
Muita paz e aparelhos em cima da mesa

A liberdade existe e está lá na praia
Com o oceano aberto solto pipa e raia
A paciência brota então do chão
Pessoas isoladas ao pé do colchão

Penso que a vida é bela
Mesmo brigado com ela
Pois tudo se faz recomeçando
Montando sobre as lágrimas secas do pranto

A palavra te faz ouvinte
Mesmo se você tem menos de vinte
Ideias são fatos dentro da mente
Evoluindo o ato de sermos gente

Escuto clássico, mas me mostra
A arte do seu algoritmo

Palavras simples são um bom caminho
De chegar ao ouvido em seu ninho
Continue dizendo a todas e todos
Em alguns pontos da vida fomos tolos

Libertar a mente e deixar de lado o fardo
Compreendendo o que é vaidade ou fato
Olhando nos olhos de quem precisa
O amor próprio cria pessoas destemidas

Penso que a vida é bela
Mesmo brigado com ela
Todo ar que respira tem poeira de sobra
Pra fazer deserto feito capim e cobra

O grande A é livre pra quem é criança
O resto um grande nó só pra quem dança
E a sessão de vinte e poucos minutos
Começa à tardinha – depois dos insultos

Escuto clássico, mas me mostra
A arte do seu algoritmo"""

L["Eu Vou Ao Show"] = """Eu vou ao show
Nas ondas do balanço inteligente
Liberto está o canto inconsciente
Revolução sonora da didática
Disfarce da canção enigmática

Eu vou ao show
O agora é apenas um pra toda fé
Tempo suficiente pra quem quer
Soletrar os versos do momento
Ou dar ao verbo um quê de movimento

Eu vou ao show
Na trilha da memória mais distante
Nos elos que se formam diamantes
Felicidade espera o próprio às
E o bem realizado não desfaz

Eu vou ao show"""

L["Que Colônia"] = """Até quando vamos vender nossos recursos naturais
Se em todo canto do mundo se vende tecnologia
No carnaval todos somos filhos de mortais
No futebol toda a beleza da bola e da magia

Tenha certeza de rejeitar todas as ofertas de ópio
No registro de ideias sementes que despertariam o ódio
E por isso alguns passam a vida de bruços na prancheta
Mantendo a inspiração trancada em suas gavetas

Que colônia
E uma bola e duas bolas e a cultura programática
E o crescimento da indústria desaba o QI nacional
Como cupins na floresta temos a festa da didática
Teatro de lá pra cá, de cá pra lá mineral
Sem o capital vadio de franquias telepáticas
Sem ativismo de sofá guiado por sinapses enfáticas
A computação não seria usada pra alterar o que é fato
E o rock não teria o quê de misógino no rebolado

Que colônia"""

L["Espelho"] = """Quem só vive em frente a um espelho
E quer só ficar de olho em si
E assim fortalecer certo respeito
Se olhando de frente dizendo que sim

Precisa é deixar as mágoas
De apenas sombras desarmadas
O tempo faz a gente escolher
Olhar e não julgar o ser

Quando um verso tira a paciência
O ar que permite fluir o roteiro
E sem fazer nenhuma exigência
Palavras que surgem do fundo do peito

Vão ajudar a deixar as mágoas
De apenas sombras desarmadas
O tempo faz a gente escolher
Olhar e não julgar o ser

E assim vai deixar as mágoas
De apenas sombras desarmadas
O tempo faz a gente escolher
Olhar e não julgar o ser"""

L["Checagem"] = """Desligue a checagem de orientação sexual
Se o que há é meramente uma defesa banal
A guarda vai alertar com sinais dos mais diversos
Mas é outro coração pulsando ali há alguns metros

Demorou te entender, mas ela sabe quem é você
Um machista com fobias da velha guarda e da TV
Marcam o fim de uma era que os colocava em risco
Permanecendo o comando de modo explícito

Insultos de intrusos que amam ou desmentem
Só o bem para encarar a espiral de frente
O amor próprio usado como encanto
Liberta corpo &amp; voz, intuito &amp; canto

Tem gente crescendo sem faltar boa intenção
Tem gente se recuperando e saindo da prisão
Alguns podem querer uma espécie de Bugatti
Para ficar de fora do bullying deste market

Procure navegar com essenciais recursos
Calculando o possível – relaxando os músculos

Com a intenção ao alcance das suas mãos
Só te resta ser feliz com o pleno coração

Com a intenção ao alcance das suas mãos
Só te resta ser feliz com o pleno coração"""

L["Dano Social"] = """Novo mundo que se apresenta por cartas
Sequências de imagens, jogos e trapaças
A cada novo dia nova manipulação
Bullying incessante que entorpece a nação

A injeção em vias de ideias humanas
Que navega por tubulações urbanas
Se houver pendência de automação
É despejada a banalização

Isto é um chamado para adultos
Disputando com serviços e produtos
Olhem bem a prateleira do mercado
Somos tudo menos seres no atacado

Pois o controle do dano social
Pornô-playback como canto visceral
Sem limites nos versos da serpente
Segue moldando corpos e diluindo mentes

No ritual da depuração cultural
Esqueça o rabo da serpente
Encare de frente e procure pela gente
Desfazendo o controle do dano social

Isto é um chamado para adultos
Disputando com serviços e produtos
Olhem bem a prateleira do mercado
Somos tudo menos seres no atacado

Pois o controle do dano social
Pornô-playback como canto visceral
Sem limites nos versos da serpente
Segue moldando corpos e diluindo mentes"""

L["A Central"] = """A central desgasta
Não desafia – e basta
O poder voraz atrai
E sem correr atrás
Desfaz
Desfaz

A liberdade e o anseio
Separados do seu meio
No marchar da expressão
O espetáculo da contramão
Distrai
Distrai

A pureza do deserto
Não perdoa o incerto
A franqueza no olhar
Vai libertar
Nosso lar"""

L["Te Trará"] = """Sem armas ou sem escudo
Cruzando pontes e castelos
Estava preso em meu mundo
Com minhas correntes sem elos
Que na força do alto mar
Levaram me pra ti
Pelo o alto mar

Então léguas a frente
Há uma terra sem passado
Sem magoas remanescentes
Onde me vejo ao seu lado
Onde os ventos irão mudar
E para bem perto de mim
Te trará

Se não puderes mais me ver
Se minha alma ao corpo não dá mais razão
Escute em meu coração o que sempre guardei para você
Veria as chamas do sol na lua crescente
Viajaria ao lado do terror
Viveria um pecador descrente
Para ter de volta o seu amor

E os ventos vão mudar
E para bem perto de mim
Te trará"""

L["Acorde"] = """Na poesia que não chegou ao fim
Você está dormindo pra mim
Vou te guardar assim
E as estrofes jogadas de lado
Me deixaram acordado
Deitado em seus braços
A-cor-de

Abri os meus olhos cegos de tanta dor
Porque você trouxe a luz pra mim e me curou

Se a métrica não se importar
Um verso, um soneto ao ar
Pra você despertar
Mas tenho o tempo ao meu lado
Pra escutar os teus passos
Desacelerados
A-cor-de

Abri os meus olhos cegos de tanta dor
Porque você trouxe a luz pra mim e me curou"""

L["Palma da Mão"] = """Não me diga o que há pra fazer
Pois agora não estou à mercê
Minhas ações não existem mais
Desejos e sonhos estão pra trás

Chega de falar em direção
Deixe-me andar em vão
As previsões não têm mais graça
Palma da mão então disfarça

Tá tudo na cara, acabou, chega
Não há certeza nem incerteza
Apenas escute o nada, a ausência
Abra a cela da sua paciência

Chega de falar em direção
Deixe-me andar em vão
As previsões não têm mais graça
Palma da mão então disfarça

O fim se despede se desprende
Cortinas se fecham bem na sua frente
Você nada mais que um belo brinquedo
Não lhe resta nem um último segredo

Chega de falar em direção
Deixe-me andar em vão
As previsões não têm mais graça
Palma da mão então disfarça

Então disfarça
Então desfaça
Então disfarça"""

CHANGES = {
  "discography/regra-zero.html": ["As Melhores Coisas da Vida"],
  "discography/disrupcao.html": ["Disrupção","Boas Palavras","Escuto Clássico","Eu Vou Ao Show","Que Colônia","Espelho","Checagem","Dano Social","A Central"],
  "discography/linha-do-tempo.html": ["Te Trará","Acorde","Palma da Mão"],
}

for page, songs in CHANGES.items():
    t = open(page, encoding="utf-8").read()
    for title in songs:
        flat = L[title].replace("\n", " ")
        flat = re.sub(r"\s+", " ", flat).strip()
        new_attr = html.escape(L[title], quote=True).replace("&#10;", "\n").replace("\n", "&#10;")
        pat = re.compile(r'data-title="' + re.escape(html.escape(title, quote=True)) + r'" data-lyrics="[^"]*"')
        m = pat.search(t)
        if not m:
            print("NOT FOUND:", page, title); sys.exit(1)
        t = pat.sub('data-title="' + html.escape(title, quote=True) + '" data-lyrics="' + new_attr + '"', t, count=1)
    open(page, "w", encoding="utf-8").write(t)
    print("fixed", page, "(", len(songs), "songs )")

# verify: every data-lyrics now contains newlines and words match the flat original
ok = True
for page, songs in CHANGES.items():
    t = open(page, encoding="utf-8").read()
    for m in re.finditer(r'data-title="([^"]+)" data-lyrics="([^"]*)"', t):
        title, body = html.unescape(m.group(1)), m.group(2)
        real = body.replace("&#10;", "\n")
        if "\n" not in real:
            print("STILL FLAT:", page, title); ok = False
        flat_real = re.sub(r"\s+", " ", html.unescape(real)).strip()
        flat_orig = re.sub(r"\s+", " ", L.get(title, html.unescape(real))).strip()
        if flat_real != flat_orig:
            print("TEXT CHANGED:", page, title); ok = False
print("VERIFY:", "OK" if ok else "FAILED")
