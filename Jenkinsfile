pipeline {
    agent { docker 'node:6.3' }
    stages {
        stage('build') {
            steps {
                sh 'npm start'
                sh 'cd ../../'
                sh 'ls'
                sh '''
                    echo "Multiline shell steps works too"
                    ls -lah
                '''
                sh 'npm --version'
            }
        }
    }
}