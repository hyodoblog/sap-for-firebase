cp .env.staging ./packages/app/.env
cp .env.staging ./packages/functions/.env

IFS=$'\n'
for env in `cat .env.staging`; do
  export $env
done

# *******************
# functions

cloudFunctions () {
  firebase use sap-app-df10e
  cd packages/functions
  firebase deploy --only functions
}

# *******************
# cloud run

cloudRun () {
  gcloud config set project sap-app-df10e
  gcloud auth configure-docker --quiet
  docker build --platform linux/amd64 -t sap-app-df10e-staging ./packages/app
  docker push gcr.io/sap-app-df10e/staging
  gcloud beta run deploy staging \
    --image gcr.io/sap-app-df10e/staging \
    --max-instances 2 \
    --region asia-northeast1 \
    --platform managed \
    --memory 1G \
    --service-account ${GCLOUD_CLIENT_EMAIL} \
    --allow-unauthenticated
}

cloudFunctions & cloudRun
# cloudFunctions
# cloudRun
