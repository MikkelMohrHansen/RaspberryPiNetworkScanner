/api/v1/scanner/getApproved
Til at få alle godkendte IP'er
    GET (igen parametere)
    Jeg får alle entries i AprovedAdresses som json

/api/v1/scanner/getUnApproved
Til at få alle ikke godkendte IP'er
    GET (ingen parametere)
    Jeg får alle UnApprovedAdresses som json

/api/v1/scanner/addApproved
Til at filføje en godkendt IP
    POST: IP adresse, MAC adresse, Description
    Den ip/mac adresse combination jeg sender forventer jeg bliver flyttet fra UnAprovedAdresses til AprovedAdresses (med description, hvis den ændres)

/api/v1/scanner/updateApproved
    PUT
Til at opdatere

/api/v1/scanner/updateUnApproved
    PUT
Til at opdatere

/api/v1/scanner/removeApproved
Til at fjerne en godkendt IP
    DELETE: IP adresse, MAC adresse, Description
    Den ip/mac adresse combination jeg sender forventer jeg bliver flyttet fra AprovedAdresses til UnAprovedAdresses (med description, hvis den ændres)

/api/vi/dataIngress
    POST
Data, MAC og IP-adresser, som kommer ind fra scanner.py


Database
    Tabel: ApprovedAdresses
        Kolonner: ID, IP adresse, MAC adresse, Description, Vendor, first seen, last seen
    Tabel: UnApprovedAdresses
        Kolonner: ID, IP adresse, MAC adresse, Description, Vendor, first seen, last seen


Til nyt python venv

Lav venv
python3 -m venv .venv

Aktiver venv
source .venv/bin/activate

installer requirements
pip install -r requirements.txt


Git commandoer til simon med CLI

Sørg for at være på main
git checkout main
git pull

Opret og skift til ny branch og commit ændringer
git checkout -b feature/<kort-navn>
git add .
git commit -m "besked"
git push -u origin feature/<kort-navn>

oprydning når pr er merged
git checkout main
git pull
git branch -d feature/<kort-navn>

Curl testing kommandoer

Login
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  http://127.0.0.1:5000/api/v1/login