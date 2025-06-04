#!/bin/bash

# Script pour configurer l'environnement de développement local

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "Création du fichier .env à partir de .env.example..."
    cp .env.example .env
    echo ".env créé avec succès. Veuillez éditer ce fichier avec vos propres clés API."
else
    echo "Le fichier .env existe déjà."
fi

# Construire et démarrer les conteneurs
echo "Construction et démarrage des conteneurs Docker..."
docker-compose up -d

# Vérifier si les conteneurs sont en cours d'exécution
echo "Vérification de l'état des conteneurs..."
sleep 5
docker-compose ps

echo ""
echo "==================================================="
echo "Configuration terminée ! L'application est accessible aux adresses suivantes :"
echo "Backend API: http://localhost:8000"
echo "Admin Portal: http://localhost:4200"
echo "Mobile App Preview: http://localhost:5000"
echo "Minio Console: http://localhost:9001"
echo "==================================================="
echo ""
echo "Pour arrêter les conteneurs : docker-compose down"
echo "Pour voir les logs : docker-compose logs -f"