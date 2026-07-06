\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{hipatia}[2023/03/17 Hipatia]
\LoadClass[11pt,twocolumn,twoside]{article}
\RequirePackage{hyperref}
\RequirePackage{wrapfig}
\RequirePackage{amsmath}
\RequirePackage{amsfonts}
\RequirePackage{amssymb}
\RequirePackage{amsthm}
\RequirePackage[brazil]{babel}
\RequirePackage{xcolor}

%\definecolor{terracota}{HTML}{3E363F}
%\definecolor{olivadark}{HTML}{73A580}
%\definecolor{olivalight}{HTML}{E1AD01}
%\definecolor{cinza}{HTML}{1F271B}

%\definecolor{terracota}{HTML}{3b3c36}
%\definecolor{olivadark}{HTML}{53917e}
%\definecolor{olivalight}{HTML}{eb9c5c}
%\definecolor{cinza}{HTML}{1F271B}

%\definecolor{terracota}{HTML}{007B6E}
%\definecolor{olivadark}{HTML}{F39213}
%\definecolor{olivalight}{HTML}{E1E0A3}
%\definecolor{cinza}{HTML}{1F271B}

%\definecolor{terracota}{HTML}{174853}
%\definecolor{olivadark}{HTML}{DDA86C}
%\definecolor{olivalight}{HTML}{FAE7C6}
%\definecolor{cinza}{HTML}{1F271B}

\definecolor{terracota}{HTML}{6A7A8E}
\definecolor{olivadark}{HTML}{77D1D0}
\definecolor{olivalight}{HTML}{E7E7E7}
\definecolor{cinza}{HTML}{1F271B}

%\definecolor{terracota}{HTML}{B35642}
%\colorlet{olivadark}{olive!70}
%\colorlet{olivalight}{olive!40}
%\colorlet{cinza}{black!70}

\RequirePackage[object=pgfhan]{pgfornament}
\usetikzlibrary{calc}
\RequirePackage{geometry}
 \geometry{
 a4paper,
 total={180mm,257mm},
 top=20mm,
 }
\setlength{\columnsep}{0.75cm}
\newcounter{volume}
\newcounter{numero}
\setcounter{volume}{4}
\setcounter{numero}{1}
\newcommand{\mesanoedicao}{Julho de 2026}
\RequirePackage{fancyhdr}
\setlength{\headheight}{15.2pt}
\pagestyle{fancyplain}
\lhead{}
\chead{}
\rhead{}
\fancyfoot[RE]{Volume \thevolume, Número \thenumero}
\fancyfoot[LO]{\mesanoedicao}
\fancyfoot[CE,CO]{Revista de Matemática Hipátia}
\fancyfoot[RO,LE]{\thepage}
\RequirePackage{titlesec}
\titleformat{\section}{\color{cinza}\normalfont\Large\bfseries}{}{0em}{}
\tikzset{
    hip/.style={cinza}
}

\tikzstyle{meanderfg}=[color=blue!70]
\tikzstyle{meanderbg}=[color=white]
\tikzstyle{meanderbox}=[color=yellow!20]
\pagecolor{white}

\tikzstyle{meanderfg}=[color=terracota]
\tikzstyle{meanderbg}=[color=olivadark]
\tikzstyle{meanderbox}=[color=olivalight]

%\tikzstyle{meanderfg}=[color=terracota]
%\tikzstyle{meanderbg}=[color=olive!70]
%\tikzstyle{meanderbox}=[color=olive!40]
%\pagecolor{olive!15}

\newcommand{\meanderbox}[3]{
\begin{scope}[x=1cm,y=1cm]
\coordinate (BL) at (0,0);
\coordinate (BR) at (4.6*#3+2*#3*#1,0);
\coordinate (UL) at (0,4.6*#3+2*#3*#2);
\coordinate (UR) at (4.6*#3+2*#3*#1,4.6*#3+2*#3*#2);
\coordinate (W) at (0.55*#3,0.55*#3);
\coordinate (WX) at (0.55*#3,-0.55*#3);
\fill[meanderbox] (BL) rectangle (UR);
\draw[line width=1.4*#3cm,meanderbg] let
  \p1 = ($(BL)-(W)$),
  \p2 = ($(UR)+(W)$) in
(\p1) rectangle (\p2);
    \node[meanderfg] at (BL)
{\pgfornament[symmetry=h,width=2.6*#3 cm]{21}};
\foreach \x in {0,...,#1}
    \node[meanderfg] (A\x) at (2.3*#3+2*#3*\x,-0.55*#3) 
{\pgfornament[symmetry=c,width=2.0*#3 cm]{39}};
\node[meanderfg] at (BR)
{\pgfornament[symmetry=c,width=2.6*#3 cm]{21}};
\foreach \y in {0,...,#2}
\node[meanderfg,rotate=90] (B\y) at (-0.55*#3,2.3*#3+2*#3*\y)
{\pgfornament[width=2*#3 cm]{39}};
\foreach \y in {0,...,#2}
\node[meanderfg,rotate=-90] (C\y) at (4.6*#3+2*#3*#1+0.55*#3,2.3*#3+2*#3*\y)
{\pgfornament[width=2*#3 cm]{39}};
    
    \node[meanderfg] at (UL)
{\pgfornament[width=2.6*#3 cm]{21}};
    \node[meanderfg] at (UR) 
{\pgfornament[symmetry=v,width=2.6*#3 cm]{21}};
\foreach \x in {0,...,#1}
    \node[meanderfg,rotate=180] (D\x) at (2.3*#3+2*#3*\x,4.6*#3+2*#3*#2+0.55*#3) 
{\pgfornament[symmetry=c,width=2.0*#3 cm]{39}};
\end{scope}
}


%\usetikzlibrary{backgrounds}
\newcommand{\meander}[5]{
\begin{tikzpicture}%[x=1cm,y=1cm,background rectangle/.style={fill=olive!35}, show background rectangle]
\meanderbox{#1}{#2}{#3}
\node[hip,align=center,font=\fontsize{36}{36}\selectfont] (Cen) at ($(BL)!0.5!(UR)-0.5*(0,#3)$) {#4};
\node[hip,align=center,below,font=\fontsize{24}{24}\selectfont] at ($(UL)!0.5!(UR)-0.5*(0,#3)$) {\scshape #5};
\end{tikzpicture}
}

\makeatletter
\DeclareRobustCommand\subtitle[1]{\gdef\@subtitle{#1}}
\def\@maketitle{%
  \newpage
  \null
%  \vskip 2em%
  \begin{center}%
  \meander{10}{1}{0.65}{\@title}{\@subtitle}
  %  {\LARGE \@title \par}%
  \end{center}%
%    \vskip 1.5em%
  \begin{flushleft}
  \let \footnote \thanks
    {\Large\itshape
      \lineskip .5em%
      \begin{tabular}[t]{c}%
        \@author
      \end{tabular}\par}%
  \end{flushleft}
    \vskip 1em%
    %{\large \@date}%
  \par
  \vskip 1.5em}
\makeatother

\usepackage[widespace]{fourier}
\usepackage[T1]{fontenc}
%\RequirePackage[T1]{fontenc}
%\RequirePackage[sc,osf]{mathpazo}


% With old-style figures and real smallcaps.
\linespread{1.025}              % Palatino leads a little more leading

% Euler for math and numbers
%\RequirePackage[euler-digits,small]{eulervm}

\newcommand{\sepdecorada}{%
 \begin{center}\begin{tikzpicture}
 \foreach \x in {0,...,4}
     \node (A\x) at (0.55*\x cm,0) 
 {\pgfornament[symmetry=c,width=0.5cm]{42}};
 \end{tikzpicture}\end{center}
}
\newcommand{\epistolapage}{1}
\newcommand{\historiapage}{3}
\newcommand{\memoriapage}{25}
\newcommand{\panoramapage}{35}
\newcommand{\tecnicapage}{41}
\newcommand{\problemapage}{48}
\bibliographystyle{plain}
\addto{\captionsbrazil}{\renewcommand{\refname}{Bibliografia}}
