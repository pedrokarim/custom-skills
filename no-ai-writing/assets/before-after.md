# Trois textes entiers, avant et après

Écrits pour ce skill. Chaque « avant » ressemble à ce que produit un assistant sans consigne ; le
script y trouve entre 8 et 20 signaux. Chaque « après » passe le script sans signal.

<!-- tell-scan: off -->

## 1. L’introduction d’un README

**Avant**

> # Bienvenue Dans Vigie 🚀
>
> Vigie n’est pas une simple application de bureau : c’est un véritable espace de travail
> modulaire, pensé pour les développeurs, les créatifs et les curieux. Dans un monde où les
> outils se multiplient, Vigie s’impose comme la pierre angulaire de votre productivité,
> permettant de centraliser tous vos widgets en un seul endroit.
>
> - **Rapide :** écrit en Rust pour des performances optimales.
> - **Modulaire :** ajoutez uniquement ce dont vous avez besoin.
> - **Élégant :** une interface soignée et intuitive.
>
> Prêt à passer au niveau supérieur ? Plongeons ensemble dans l’installation !

**Après**

> # Vigie
>
> Application de bureau en Rust qui affiche des widgets sur l’écran : horloge, météo, file de
> téléchargements, état des serveurs. Chaque widget est un module qu’on active ou non dans
> `vigie.toml` ; un module manquant ne coûte rien au démarrage.
>
> Windows 10 et 11 seulement pour l’instant. L’installation prend une commande :

Ce qui a changé : le h1 garde le nom seul ; « n’est pas… c’est » et « véritable » partent ; les
trois atouts en gras, invérifiables, laissent la place à ce que fait l’application et à la liste
réelle de ses widgets ; la limite (Windows seulement) est dite, parce qu’un lecteur en a besoin.

## 2. Une annonce sur Discord

**Avant**

> 🎉 Grande nouvelle ! Le marché des cartes est enfin là — et ça change tout.
>
> Fini les échanges compliqués. Fini l’attente. Place à un système fluide, sécurisé et pensé pour
> vous. Que vous soyez collectionneur chevronné ou simple curieux, le marché vous permettra
> d’acheter, de vendre et d’échanger en toute simplicité.
>
> N’hésitez pas à nous faire part de vos retours ! 💬

**Après**

> Le marché des cartes ouvre ce soir à 20 h. On peut y mettre en vente une carte en double, au
> prix de son choix, et acheter celles des autres avec ses pièces. Une commission de 5 % est
> prélevée sur chaque vente.
>
> Les cartes « Édition fondateur » ne peuvent pas être vendues. Un bug ou une question : salon
> #marché.

Ce qui a changé : l’heure, le fonctionnement, la commission et la limite remplacent l’émotion
annoncée ; « Fini X. Fini Y. », la série de trois et « que vous soyez » disparaissent ; le
dernier paragraphe dit où écrire au lieu d’inviter à « faire part de ses retours ».

## 3. Un message de commit

**Avant**

> feat: amélioration significative du système de notifications
>
> - **Refactorisation** du module de notifications pour une meilleure maintenabilité
> - **Optimisation** des performances d’envoi
> - **Renforcement** de la robustesse globale tout en préservant le comportement existant
>
> Ces changements s’inscrivent dans une démarche d’amélioration continue de la qualité du code.

**Après**

> Notifications : un seul envoi groupé par minute
>
> Chaque événement envoyait sa propre requête à l’API Discord ; au-delà de 50 événements par
> minute, Discord renvoyait 429 et les messages suivants étaient perdus. Les événements sont
> maintenant regroupés et envoyés toutes les 60 s, avec une nouvelle tentative après un 429.

Ce qui a changé : le titre dit le changement ; le corps dit la cause (le 429 et les messages
perdus) et le mécanisme. Les trois verbes en gras n’apprenaient rien à la personne qui lira
`git log` dans six mois.

<!-- tell-scan: on -->
