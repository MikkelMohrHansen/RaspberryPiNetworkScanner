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
        Kolonner: ID, IP adresse, MAC adresse, Description, first seen, last seen
    Tabel: UnApprovedAdresses
        Kolonner: ID, IP adresse, MAC adresse, Description, first seen, last seen





192.168.1.20, A3:23:62:6D:4C
192.168.1.21, A3:23:62:6D:4C
192.168.1.20, A3:23:62:6D:29