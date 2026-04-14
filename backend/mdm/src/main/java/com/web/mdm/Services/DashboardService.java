package com.web.mdm.Services;

import com.web.mdm.Dto.DashboardSummaryDto;
import com.web.mdm.Repository.CarteSimRepository;
import com.web.mdm.Repository.LigneInternetRepository;
import com.web.mdm.Repository.MaterielsRepository;
import com.web.mdm.Repository.MobileRepository;
import com.web.mdm.Repository.UsersRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DashboardService {

    private final UsersRepository usersRepository;
    private final MobileRepository mobileRepository;
    private final CarteSimRepository carteSimRepository;
    private final LigneInternetRepository ligneInternetRepository;
    private final MaterielsRepository materielsRepository;

    public DashboardService(
            UsersRepository usersRepository,
            MobileRepository mobileRepository,
            CarteSimRepository carteSimRepository,
            LigneInternetRepository ligneInternetRepository,
            MaterielsRepository materielsRepository) {
        this.usersRepository = usersRepository;
        this.mobileRepository = mobileRepository;
        this.carteSimRepository = carteSimRepository;
        this.ligneInternetRepository = ligneInternetRepository;
        this.materielsRepository = materielsRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        List<DashboardSummaryDto.UserSummaryDto> users = usersRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.UserSummaryDto(
                        item.getId(),
                        item.getStatus(),
                        item.getAgenceId() == null ? null : new DashboardSummaryDto.AgencySummaryDto(item.getAgenceId(), item.getAgenceNom()),
                        item.getDepartementId() == null ? null : new DashboardSummaryDto.DepartementSummaryDto(item.getDepartementId(), item.getDepartementNom()),
                        item.getEntrepotId() == null ? null : new DashboardSummaryDto.EntrepotSummaryDto(item.getEntrepotId(), item.getEntrepotNom())))
                .toList();

        List<DashboardSummaryDto.MobileSummaryDto> mobiles = mobileRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.MobileSummaryDto(
                        item.getId(),
                        item.getType(),
                        item.getStatus(),
                        item.getStatusAffectation(),
                        item.getAgenceId(),
                        item.getUserId(),
                        item.getDepartementId(),
                        item.getEntrepotId(),
                        item.getDateCreation()))
                .toList();

        List<DashboardSummaryDto.CarteSimSummaryDto> sims = carteSimRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.CarteSimSummaryDto(
                        item.getId(),
                        item.getStatus(),
                        item.getStatusAffectation(),
                        item.getAgenceId(),
                        item.getDateCreation()))
                .toList();

        List<DashboardSummaryDto.LigneInternetSummaryDto> internetLines = ligneInternetRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.LigneInternetSummaryDto(
                        item.getId(),
                        item.getStatus(),
                        item.getStatusAffectation(),
                        item.getAgenceId(),
                        item.getDateCreation()))
                .toList();

        List<DashboardSummaryDto.MaterielSummaryDto> materiels = materielsRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.MaterielSummaryDto(
                        item.getId(),
                        item.getTypeMateriel(),
                        item.getStatus(),
                        item.getStatusAffectation(),
                        item.getAgenceId(),
                        item.getUserId(),
                        item.getDepartementId(),
                        item.getEntrepotId(),
                        item.getDateCreation()))
                .toList();

        return new DashboardSummaryDto(users, mobiles, sims, internetLines, materiels);
    }
}
