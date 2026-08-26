To run the project: npm start (localhost:3000)
Api endpoint: POST(localhost:3000/patient-query, {
    headers: {
        'x-clinic-id': 'clinic-123'
    }
    body: {
        patientId: UUID,
        query: 'any query'
    }
})
To run test: npm test