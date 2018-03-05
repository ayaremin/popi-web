pipeline {
    agent { docker 'node:6.3' }
    stages {
        stage('build') {
            steps {
                sh 'ssh root@104.236.87.130'
                sh 'ls /var/www'
            }
        }
    }
}